import type { FlowStatus, RideStatus } from '../types/flow';
import { getStatusMessage, getStatusEmoji, getRideStatusLabel, getRideStatusMessage } from '../utils/microcopy';
import { formatCFS } from '../utils/formatters';
import { formatHour } from '../utils/timezone';

interface FlowIndicatorProps {
  status: FlowStatus;
  rideStatus: RideStatus;
  flowAtDam: number;
  flowAtHouse: number;
  currentHourPT: number;
  nextChangeTime: string | null;
}

const statusStyles: Record<FlowStatus, { bg: string; border: string; text: string; glow: string }> = {
  good: {
    bg: 'bg-good-light dark:bg-green-900/40',
    border: 'border-good',
    text: 'text-good dark:text-green-400',
    glow: 'shadow-[0_0_20px_rgba(22,163,74,0.3)]',
  },
  rising: {
    bg: 'bg-warn-light dark:bg-yellow-900/30',
    border: 'border-warn',
    text: 'text-amber-700 dark:text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
  },
  falling: {
    bg: 'bg-warn-light dark:bg-yellow-900/30',
    border: 'border-warn',
    text: 'text-amber-700 dark:text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
  },
  low: {
    bg: 'bg-low-light dark:bg-red-900/30',
    border: 'border-low',
    text: 'text-low dark:text-red-400',
    glow: 'shadow-[0_0_20px_rgba(220,38,38,0.2)]',
  },
};

const rideStatusBadge: Record<RideStatus, { bg: string; text: string }> = {
  'good': { bg: 'bg-good/15', text: 'text-good dark:text-green-400' },
  'caution': { bg: 'bg-yellow-400/20', text: 'text-yellow-700 dark:text-yellow-400' },
  'extreme-caution': { bg: 'bg-orange-400/20', text: 'text-orange-700 dark:text-orange-400' },
  'no-go': { bg: 'bg-low/15', text: 'text-low dark:text-red-400' },
};

export function FlowIndicator({ status, rideStatus, flowAtDam, flowAtHouse, currentHourPT, nextChangeTime }: FlowIndicatorProps) {
  const style = statusStyles[status];
  const badge = rideStatusBadge[rideStatus];

  // Use ride-status-aware message when in caution zones
  const isCaution = rideStatus === 'caution' || rideStatus === 'extreme-caution';
  const message = isCaution ? getRideStatusMessage(rideStatus) : getStatusMessage(status);
  const emoji = isCaution ? (rideStatus === 'caution' ? '⚠️' : '🟠') : getStatusEmoji(status);

  return (
    <div className={`rounded-2xl border-2 ${style.border} ${style.bg} ${style.glow} p-5 relative overflow-hidden`}>
      {status === 'good' && <div className="absolute inset-0 wave-shimmer pointer-events-none" />}

      <div className="relative z-10">
        {/* Status headline */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{emoji}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-xl font-bold font-[family-name:var(--font-heading)] ${style.text}`}>
                {message}
              </p>
              {isCaution && (
                <span className={`text-[10px] ${badge.bg} ${badge.text} px-2 py-0.5 rounded-full font-semibold`}>
                  {getRideStatusLabel(rideStatus)}
                </span>
              )}
            </div>
            {nextChangeTime && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {status === 'rising' && `Should be good by ${nextChangeTime}`}
                {status === 'falling' && !isCaution && `Flow drops around ${nextChangeTime}`}
                {status === 'falling' && isCaution && `Flow may return by ${nextChangeTime}`}
              </p>
            )}
          </div>
        </div>

        {/* Flow numbers */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">At River House</p>
            <p className={`text-2xl font-bold font-[family-name:var(--font-heading)] ${style.text}`}>
              {formatCFS(flowAtHouse)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">CFS (est.)</p>
          </div>
          <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">At Dam</p>
            <p className="text-2xl font-bold font-[family-name:var(--font-heading)] text-river-dark dark:text-river-light">
              {formatCFS(flowAtDam)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">CFS</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
          As of {formatHour(currentHourPT)} PT — river house flow is ~1hr behind dam
        </p>
      </div>
    </div>
  );
}
