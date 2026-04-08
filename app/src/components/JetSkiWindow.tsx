import type { DailyFlowData, RideStatus } from '../types/flow';
import { computeHourlyRideStatus } from '../utils/thresholds';
import { formatHour } from '../utils/timezone';
import { getRideStatusLabel, getRideStatusEmoji } from '../utils/microcopy';

interface JetSkiWindowProps {
  flowData: DailyFlowData;
  sunriseHour?: number;
  sunsetHour?: number;
}

interface TimeWindow {
  startPT: number;
  endPT: number;
  peakFlow: number;
  rideStatus: RideStatus; // worst status in the window
}

const DEFAULT_SUNRISE = 6;
const DEFAULT_SUNSET = 19;

/**
 * Find contiguous rideable windows (good, caution, or extreme-caution),
 * limited to daylight hours.
 */
function findRideableWindows(flowData: DailyFlowData, sunrise: number, sunset: number): TimeWindow[] {
  const rideMap = computeHourlyRideStatus(flowData);
  const windows: TimeWindow[] = [];
  let currentWindow: TimeWindow | null = null;

  for (let pt = 0; pt < 24; pt++) {
    const isDaylight = pt >= sunrise && pt < sunset;
    const entry = rideMap.get(pt);
    const rideStatus = entry?.rideStatus ?? 'no-go';
    const houseFlow = entry?.houseFlow ?? 0;
    const isRideable = rideStatus !== 'no-go' && isDaylight;

    if (isRideable) {
      if (!currentWindow) {
        currentWindow = { startPT: pt, endPT: pt, peakFlow: houseFlow, rideStatus };
      } else {
        currentWindow.endPT = pt;
        currentWindow.peakFlow = Math.max(currentWindow.peakFlow, houseFlow);
        // Track the worst ride status in the window
        if (rideStatusSeverity(rideStatus) > rideStatusSeverity(currentWindow.rideStatus)) {
          currentWindow.rideStatus = rideStatus;
        }
      }
    } else if (currentWindow) {
      windows.push(currentWindow);
      currentWindow = null;
    }
  }
  if (currentWindow) windows.push(currentWindow);

  return windows;
}

function rideStatusSeverity(status: RideStatus): number {
  switch (status) {
    case 'good': return 0;
    case 'caution': return 1;
    case 'extreme-caution': return 2;
    case 'no-go': return 3;
  }
}

// Break a window into sub-segments by ride status for display
function getWindowSegments(flowData: DailyFlowData, window: TimeWindow): Array<{ startPT: number; endPT: number; rideStatus: RideStatus }> {
  const rideMap = computeHourlyRideStatus(flowData);
  const segments: Array<{ startPT: number; endPT: number; rideStatus: RideStatus }> = [];
  let current: { startPT: number; endPT: number; rideStatus: RideStatus } | null = null;

  for (let pt = window.startPT; pt <= window.endPT; pt++) {
    const status = rideMap.get(pt)?.rideStatus ?? 'no-go';
    if (current && current.rideStatus === status) {
      current.endPT = pt;
    } else {
      if (current) segments.push(current);
      current = { startPT: pt, endPT: pt, rideStatus: status };
    }
  }
  if (current) segments.push(current);

  return segments;
}

const dotColor: Record<RideStatus, string> = {
  'good': 'bg-good',
  'caution': 'bg-yellow-400',
  'extreme-caution': 'bg-orange-500',
  'no-go': 'bg-low',
};

export function JetSkiWindow({ flowData, sunriseHour, sunsetHour }: JetSkiWindowProps) {
  const sunrise = sunriseHour ?? DEFAULT_SUNRISE;
  const sunset = sunsetHour ?? DEFAULT_SUNSET;
  const windows = findRideableWindows(flowData, sunrise, sunset);

  if (windows.length === 0) {
    return (
      <div className="rounded-2xl border border-low/20 bg-low-light/30 dark:bg-red-900/20 p-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          🏜️ No rideable windows today during daylight hours
        </p>
      </div>
    );
  }

  const totalHours = windows.reduce((sum, w) => sum + (w.endPT - w.startPT + 1), 0);

  return (
    <div className="rounded-2xl border border-good/20 bg-good-light/30 dark:bg-green-900/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🚤</span>
        <h3 className="text-sm font-semibold text-river-dark dark:text-river-light font-[family-name:var(--font-heading)]">
          Jet Ski Windows
        </h3>
        <span className="text-[10px] bg-good/10 text-good px-2 py-0.5 rounded-full font-medium ml-auto">
          {totalHours}hr{totalHours !== 1 ? 's' : ''} rideable
        </span>
      </div>

      <div className="space-y-2">
        {windows.map((w, i) => {
          const segments = getWindowSegments(flowData, w);
          const hasMixedStatus = segments.length > 1 || w.rideStatus !== 'good';

          return (
            <div key={i} className="bg-white/70 dark:bg-white/10 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dotColor[w.rideStatus]}`} />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {formatHour(w.startPT)} – {formatHour((w.endPT + 1) % 24)}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Peak: {w.peakFlow.toLocaleString()} CFS
                </span>
              </div>
              {hasMixedStatus && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {segments.map((seg, j) => (
                    <span
                      key={j}
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: seg.rideStatus === 'good' ? 'rgba(22,163,74,0.12)'
                          : seg.rideStatus === 'caution' ? 'rgba(234,179,8,0.15)'
                          : 'rgba(249,115,22,0.15)',
                        color: seg.rideStatus === 'good' ? '#16A34A'
                          : seg.rideStatus === 'caution' ? '#A16207'
                          : '#C2410C',
                      }}
                    >
                      {getRideStatusEmoji(seg.rideStatus)} {formatHour(seg.startPT)}–{formatHour((seg.endPT + 1) % 24)}: {getRideStatusLabel(seg.rideStatus)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
        Daylight hours only (sunrise {formatHour(sunrise)}, sunset {formatHour(sunset)}) · 1hr downstream delay
      </p>
    </div>
  );
}
