import { formatDateFull } from '../utils/formatters';

interface DayNavigatorProps {
  selectedDate: string;
  hasPrev: boolean;
  hasNext: boolean;
  isToday: boolean;
  isForecast?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function DayNavigator({
  selectedDate,
  hasPrev,
  hasNext,
  isToday,
  isForecast,
  onPrev,
  onNext,
  onToday,
}: DayNavigatorProps) {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border px-4 py-3">
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="w-10 h-10 rounded-full flex items-center justify-center text-river-dark dark:text-river-light hover:bg-river/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous day"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="text-center flex-1 min-w-0">
        <p className="text-sm font-semibold text-river-dark dark:text-river-light font-[family-name:var(--font-heading)] truncate">
          {formatDateFull(selectedDate)}
        </p>
        <div className="flex items-center justify-center gap-2 mt-0.5">
          {isToday && (
            <span className="text-[10px] bg-river/10 text-river px-2 py-0.5 rounded-full font-medium">
              Today
            </span>
          )}
          {isForecast && (
            <span className="text-[10px] bg-sand-light dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
              Forecast
            </span>
          )}
          {!isToday && (
            <button
              onClick={onToday}
              className="text-[10px] text-river underline hover:text-river-dark transition-colors"
            >
              Go to today
            </button>
          )}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!hasNext}
        className="w-10 h-10 rounded-full flex items-center justify-center text-river-dark dark:text-river-light hover:bg-river/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        aria-label="Next day"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
