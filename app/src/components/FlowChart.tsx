import { useSyncExternalStore } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { DailyFlowData } from '../types/flow';
import { GOOD_FLOW_CFS } from '../utils/thresholds';
import { mstHourToPT, formatHour, getCurrentHourPT } from '../utils/timezone';
import { formatCFS } from '../utils/formatters';

// Subscribe to dark mode changes on <html>
const subscribe = (cb: () => void) => {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};
const getSnapshot = () => document.documentElement.classList.contains('dark');

interface FlowChartProps {
  flowData: DailyFlowData;
  isToday: boolean;
}

interface ChartDataPoint {
  hourPT: number;
  hourLabel: string;
  damFlow: number;
  houseFlow: number;
}

export function FlowChart({ flowData, isToday }: FlowChartProps) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot);
  const today = new Date();
  const currentHourPT = getCurrentHourPT();
  const tickColor = isDark ? '#94A3B8' : '#9ca3af';

  // Build chart data: convert MST hours to PT and create house flow (shifted +1hr)
  const damFlowByPT = new Map<number, number>();
  for (const h of flowData.hours) {
    const ptHour = mstHourToPT(h.hour, today);
    damFlowByPT.set(ptHour, h.parkerFlow);
  }

  const chartData: ChartDataPoint[] = [];
  for (let pt = 0; pt < 24; pt++) {
    const damFlow = damFlowByPT.get(pt) ?? 0;
    // House flow at hour X = dam flow at hour X-1 (1-hour delay)
    const houseSourcePT = pt === 0 ? 23 : pt - 1;
    const houseFlow = damFlowByPT.get(houseSourcePT) ?? 0;

    chartData.push({
      hourPT: pt,
      hourLabel: formatHour(pt),
      damFlow,
      houseFlow,
    });
  }

  const maxFlow = Math.max(...chartData.map(d => Math.max(d.damFlow, d.houseFlow)));
  const yMax = Math.ceil(maxFlow / 2000) * 2000 + 2000;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-river-dark dark:text-river-light font-[family-name:var(--font-heading)]">
          24-Hour Flow Profile
        </h3>
        {flowData.isForecast && (
          <span className="text-[10px] bg-sand-light text-amber-800 px-2 py-0.5 rounded-full font-medium">
            Forecast
          </span>
        )}
      </div>

      <div className="flex gap-4 text-[10px] text-gray-500 dark:text-gray-400 mb-2">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-river inline-block rounded" /> Dam Release
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-sand inline-block rounded" /> At River House
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-good inline-block rounded opacity-60" /> 8,000 CFS
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
          <defs>
            <linearGradient id="damGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891B2" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0891B2" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2A3A4E' : '#f0f0f0'} />

          <XAxis
            dataKey="hourPT"
            tickFormatter={(h: number) => {
              if (h % 3 === 0) return formatHour(h);
              return '';
            }}
            tick={{ fontSize: 10, fill: tickColor }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            domain={[0, yMax]}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10, fill: tickColor }}
            tickLine={false}
            axisLine={false}
            width={35}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0].payload as ChartDataPoint;
              return (
                <div className="bg-river-dark dark:bg-dark-surface text-white text-xs rounded-lg p-2.5 shadow-lg">
                  <p className="font-semibold mb-1">{data.hourLabel} PT</p>
                  <p>Dam: <span className="font-mono">{formatCFS(data.damFlow)}</span> CFS</p>
                  <p>House: <span className="font-mono">{formatCFS(data.houseFlow)}</span> CFS</p>
                  {data.houseFlow >= GOOD_FLOW_CFS ? (
                    <p className="text-green-300 mt-1 font-medium">Good for riding!</p>
                  ) : (
                    <p className="text-red-300 mt-1">Below threshold</p>
                  )}
                </div>
              );
            }}
          />

          {/* Threshold line */}
          <ReferenceLine
            y={GOOD_FLOW_CFS}
            stroke="#16A34A"
            strokeDasharray="6 4"
            strokeOpacity={0.6}
            label={{
              value: '8k CFS',
              position: 'right',
              fill: '#16A34A',
              fontSize: 10,
            }}
          />

          {/* Current time indicator */}
          {isToday && (
            <ReferenceLine
              x={currentHourPT}
              stroke="#D97706"
              strokeDasharray="4 2"
              strokeWidth={1.5}
              label={{
                value: 'Now',
                position: 'top',
                fill: '#D97706',
                fontSize: 10,
              }}
            />
          )}

          {/* House flow line (distinct from dam) */}
          <Area
            type="monotone"
            dataKey="houseFlow"
            stroke={isDark ? '#F59E0B' : '#D97706'}
            strokeWidth={2}
            strokeOpacity={0.85}
            fill="none"
            strokeDasharray="6 3"
            dot={false}
          />

          {/* Dam flow area (front) */}
          <Area
            type="monotone"
            dataKey="damFlow"
            stroke="#0891B2"
            strokeWidth={2}
            fill="url(#damGradient)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Daily average */}
      <div className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
        Daily Average: <span className="font-mono font-medium text-gray-600 dark:text-gray-300">{formatCFS(flowData.dailyAverage)}</span> CFS
      </div>
    </div>
  );
}
