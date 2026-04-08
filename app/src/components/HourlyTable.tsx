import { useState } from 'react';
import type { DailyFlowData } from '../types/flow';
import { computeHourlyRideStatus } from '../utils/thresholds';
import { formatHour } from '../utils/timezone';
import { formatCFS } from '../utils/formatters';
import { getRideStatusEmoji, getRideStatusLabel } from '../utils/microcopy';

interface HourlyTableProps {
  flowData: DailyFlowData;
}

export function HourlyTable({ flowData }: HourlyTableProps) {
  const [expanded, setExpanded] = useState(false);
  const rideMap = computeHourlyRideStatus(flowData);

  // Build sorted rows by PT hour
  const rows = Array.from(rideMap.entries())
    .map(([ptHour, entry]) => ({ ptHour, ...entry }))
    .sort((a, b) => a.ptHour - b.ptHour);

  const rowBg = {
    'good': 'bg-good-light/20 dark:bg-green-900/20',
    'caution': 'bg-yellow-50 dark:bg-yellow-900/15',
    'extreme-caution': 'bg-orange-50 dark:bg-orange-900/15',
    'no-go': '',
  };

  const flowColor = {
    'good': 'text-good dark:text-green-400',
    'caution': 'text-yellow-700 dark:text-yellow-400',
    'extreme-caution': 'text-orange-600 dark:text-orange-400',
    'no-go': 'text-gray-500 dark:text-gray-400',
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <h3 className="text-sm font-semibold text-river-dark dark:text-river-light font-[family-name:var(--font-heading)]">
          Hourly Breakdown
        </h3>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-dark-border">
                <th className="text-left py-1.5 font-medium">Time (PT)</th>
                <th className="text-right py-1.5 font-medium">Dam CFS</th>
                <th className="text-right py-1.5 font-medium">House CFS</th>
                <th className="text-center py-1.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.ptHour}
                  className={`border-b border-gray-50 dark:border-dark-border/50 ${rowBg[row.rideStatus]}`}
                >
                  <td className="py-1.5 text-gray-700 dark:text-gray-300">{formatHour(row.ptHour)}</td>
                  <td className="py-1.5 text-right font-mono text-gray-700 dark:text-gray-300">
                    {formatCFS(row.damFlow)}
                  </td>
                  <td className={`py-1.5 text-right font-mono font-medium ${flowColor[row.rideStatus]}`}>
                    {formatCFS(row.houseFlow)}
                  </td>
                  <td className="py-1.5 text-center" title={getRideStatusLabel(row.rideStatus)}>
                    {getRideStatusEmoji(row.rideStatus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
