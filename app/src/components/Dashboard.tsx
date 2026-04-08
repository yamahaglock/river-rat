import { useFlowData } from '../hooks/useFlowData';
import { useCurrentConditions } from '../hooks/useCurrentConditions';
import { useWeather } from '../hooks/useWeather';
import { FlowIndicator } from './FlowIndicator';
import { WeatherCard } from './WeatherCard';
import { FlowChart } from './FlowChart';
import { DayNavigator } from './DayNavigator';
import { JetSkiWindow } from './JetSkiWindow';
import { HourlyTable } from './HourlyTable';

export function Dashboard() {
  const {
    flowData,
    selectedDate,
    loading,
    error,
    goToPrevDay,
    goToNextDay,
    goToToday,
    hasPrev,
    hasNext,
    isToday,
  } = useFlowData();

  const conditions = useCurrentConditions(isToday ? flowData : null);
  const { weather, loading: weatherLoading } = useWeather();

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="rounded-2xl border border-low/30 bg-low-light/30 dark:bg-red-900/20 p-6 max-w-md mx-auto">
          <p className="text-lg mb-2">🏜️</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Couldn't load flow data</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl" />
            <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-6 h-72 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-[max(6rem,env(safe-area-inset-bottom))] lg:pb-4">
      {/* Desktop layout: two columns */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-4 space-y-4 lg:space-y-0">
        {/* Left column: status + weather */}
        <div className="lg:col-span-1 space-y-4">
          {/* Current conditions (only on "today") */}
          {conditions && (
            <FlowIndicator
              status={conditions.status}
              rideStatus={conditions.rideStatus}
              flowAtDam={conditions.flowAtDam}
              flowAtHouse={conditions.flowAtHouse}
              currentHourPT={conditions.currentHourPT}
              nextChangeTime={conditions.nextChangeTime}
            />
          )}

          {/* Weather */}
          <WeatherCard
            weather={weather}
            loading={weatherLoading}
            selectedDate={selectedDate}
          />

          {/* Jet ski windows (daylight hours only) */}
          {flowData && (() => {
            const dayWeather = weather?.daily.find(d => d.date === selectedDate);
            return (
              <JetSkiWindow
                flowData={flowData}
                sunriseHour={dayWeather?.sunriseHour}
                sunsetHour={dayWeather?.sunsetHour}
              />
            );
          })()}
        </div>

        {/* Right column: chart + navigation + table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Day navigation */}
          <DayNavigator
            selectedDate={selectedDate}
            hasPrev={hasPrev}
            hasNext={hasNext}
            isToday={isToday}
            isForecast={flowData?.isForecast}
            onPrev={goToPrevDay}
            onNext={goToNextDay}
            onToday={goToToday}
          />

          {/* Flow chart */}
          {flowData && (
            <FlowChart flowData={flowData} isToday={isToday} />
          )}

          {/* Hourly table */}
          {flowData && <HourlyTable flowData={flowData} />}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[10px] text-gray-400 dark:text-gray-500 pt-2 pb-2">
        Data from{' '}
        <a
          href="https://www.usbr.gov/lc/region/g4000/hourly/HeadgateReport.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-river"
        >
          USBR Headgate Rock Dam Report
        </a>
        {' · '}Flow threshold: 8,000 CFS{' · '}River house ~1hr downstream
      </footer>
    </div>
  );
}
