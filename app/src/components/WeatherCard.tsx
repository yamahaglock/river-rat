import type { WeatherData, DailyWeather } from '../types/weather';
import { weatherDescriptions } from '../types/weather';
import { formatTemp } from '../utils/formatters';

interface WeatherCardProps {
  weather: WeatherData | null;
  loading: boolean;
  selectedDate?: string;
}

function getWeatherInfo(code: number) {
  return weatherDescriptions[code] || { label: 'Unknown', icon: '🌡' };
}

export function WeatherCard({ weather, loading, selectedDate }: WeatherCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-sand/30 dark:border-dark-border bg-white dark:bg-dark-card p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    );
  }

  if (!weather) return null;

  const { current, daily } = weather;
  const currentInfo = getWeatherInfo(current.weatherCode);

  // Find weather for the selected date
  const selectedDayWeather = selectedDate
    ? daily.find(d => d.date === selectedDate)
    : null;

  return (
    <div className="rounded-2xl border border-sand/30 dark:border-dark-border bg-white dark:bg-dark-card p-4">
      {/* Current conditions */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <span>🌵</span> Parker, AZ Area
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-[family-name:var(--font-heading)] text-river-dark dark:text-river-light">
              {formatTemp(current.temperature)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Feels {formatTemp(current.apparentTemperature)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl">{currentInfo.icon}</span>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{currentInfo.label}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span>💨 {Math.round(current.windSpeed)} mph</span>
        <span>💧 {current.humidity}%</span>
        {selectedDayWeather && (
          <span>🌡 {formatTemp(selectedDayWeather.temperatureMin)}–{formatTemp(selectedDayWeather.temperatureMax)}</span>
        )}
      </div>

      {/* 5-day mini forecast */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border">
        <div className="flex justify-between">
          {daily.slice(0, 5).map((day: DailyWeather) => {
            const info = getWeatherInfo(day.weatherCode);
            const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <div key={day.date} className="text-center flex-1">
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{dayLabel}</p>
                <p className="text-sm">{info.icon}</p>
                <p className="text-[10px] text-gray-600 dark:text-gray-400">
                  {Math.round(day.temperatureMax)}°
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
