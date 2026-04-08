export interface CurrentWeather {
  temperature: number;     // Fahrenheit
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;       // mph
  humidity: number;        // %
  isDay: boolean;
}

export interface DailyWeather {
  date: string;            // YYYY-MM-DD
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  precipitationProbability: number;
  windSpeedMax: number;
  sunriseHour: number;     // Hour (0-23) in PT
  sunsetHour: number;      // Hour (0-23) in PT
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyWeather[];
}

// WMO weather codes to descriptions
export const weatherDescriptions: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mostly clear', icon: '🌤' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫' },
  48: { label: 'Icy fog', icon: '🌫' },
  51: { label: 'Light drizzle', icon: '🌦' },
  53: { label: 'Drizzle', icon: '🌦' },
  55: { label: 'Heavy drizzle', icon: '🌧' },
  61: { label: 'Light rain', icon: '🌦' },
  63: { label: 'Rain', icon: '🌧' },
  65: { label: 'Heavy rain', icon: '🌧' },
  80: { label: 'Light showers', icon: '🌦' },
  81: { label: 'Showers', icon: '🌧' },
  82: { label: 'Heavy showers', icon: '🌧' },
  95: { label: 'Thunderstorm', icon: '⛈' },
  96: { label: 'Thunderstorm w/ hail', icon: '⛈' },
  99: { label: 'Thunderstorm w/ heavy hail', icon: '⛈' },
};
