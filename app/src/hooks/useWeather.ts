import { useState, useEffect } from 'react';
import type { WeatherData, CurrentWeather, DailyWeather } from '../types/weather';
import { PARKER_LAT, PARKER_LON } from '../utils/thresholds';

const WEATHER_API = `https://api.open-meteo.com/v1/forecast?latitude=${PARKER_LAT}&longitude=${PARKER_LON}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Los_Angeles&forecast_days=7`;

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        const res = await fetch(WEATHER_API);
        if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
        const json = await res.json();

        if (cancelled) return;

        const current: CurrentWeather = {
          temperature: json.current.temperature_2m,
          apparentTemperature: json.current.apparent_temperature,
          weatherCode: json.current.weather_code,
          windSpeed: json.current.wind_speed_10m,
          humidity: json.current.relative_humidity_2m,
          isDay: json.current.is_day === 1,
        };

        const daily: DailyWeather[] = json.daily.time.map((date: string, i: number) => ({
          date,
          temperatureMax: json.daily.temperature_2m_max[i],
          temperatureMin: json.daily.temperature_2m_min[i],
          weatherCode: json.daily.weather_code[i],
          precipitationProbability: json.daily.precipitation_probability_max[i],
          windSpeedMax: json.daily.wind_speed_10m_max[i],
          sunriseHour: new Date(json.daily.sunrise[i]).getHours(),
          sunsetHour: new Date(json.daily.sunset[i]).getHours(),
        }));

        setWeather({ current, daily });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load weather');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { weather, loading, error };
}
