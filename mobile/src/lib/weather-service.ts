import * as Location from 'expo-location';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  cityName: string;
}

export async function getCurrentWeather(): Promise<WeatherData | null> {
  try {
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission not granted');
      return null;
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    // Fetch weather data
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.EXPO_PUBLIC_VIBECODE_OPENWEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error('Weather API request failed');
    }

    const weather = await response.json();

    return {
      temp: Math.round(weather.main.temp),
      feelsLike: Math.round(weather.main.feels_like),
      description: weather.weather[0].description,
      icon: weather.weather[0].icon,
      humidity: weather.main.humidity,
      windSpeed: weather.wind.speed,
      cityName: weather.name,
    };
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}

export function getWeatherEmoji(icon: string): string {
  const iconMap: { [key: string]: string } = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '☁️',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌧️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '❄️',
    '13n': '❄️',
    '50d': '🌫️',
    '50n': '🌫️',
  };

  return iconMap[icon] || '🌤️';
}
