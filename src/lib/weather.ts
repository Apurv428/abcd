export interface WeatherData {
  temperature: number;
  humidity: number;
  uvIndex: number;
  description: string;
  city: string;
}

const API_KEY = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || "")
  : (process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || "");

export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  if (!API_KEY) return getFallbackWeather("Your Location");
  try {
    const [weatherRes, uvRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
      fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`).catch(() => null),
    ]);
    if (!weatherRes.ok) return getFallbackWeather("Your Location");
    const weatherData = await weatherRes.json();
    let uvIndex = 0;
    if (uvRes && uvRes.ok) {
      const uvData = await uvRes.json();
      uvIndex = Math.round(uvData.value ?? 0);
    }
    return {
      temperature: Math.round(weatherData.main?.temp ?? 25),
      humidity: weatherData.main?.humidity ?? 55,
      uvIndex,
      description: weatherData.weather?.[0]?.description ?? "Clear",
      city: weatherData.name ?? "Your Location",
    };
  } catch {
    return getFallbackWeather("Your Location");
  }
}

export async function getCityFromCoords(lat: number, lon: number): Promise<{ city: string; country: string }> {
  if (!API_KEY) return { city: "Your Location", country: "Your Country" };
  try {
    const res = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
    if (!res.ok) return { city: "Your Location", country: "Your Country" };
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        city: data[0].name || "Your Location",
        country: data[0].country || "Your Country",
      };
    }
    return { city: "Your Location", country: "Your Country" };
  } catch {
    return { city: "Your Location", country: "Your Country" };
  }
}

export async function getWeatherData(city: string): Promise<WeatherData> {
  if (!API_KEY || !city) return getFallbackWeather(city || "Your Location");
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`);
    if (!res.ok) return getFallbackWeather(city);
    const data = await res.json();
    const lat = data.coord?.lat;
    const lon = data.coord?.lon;
    let uvIndex = 0;
    if (lat && lon) {
      try {
        const uvRes = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
        if (uvRes.ok) {
          const uvData = await uvRes.json();
          uvIndex = Math.round(uvData.value ?? 0);
        }
      } catch { /* ignore UV fetch failure */ }
    }
    return {
      temperature: Math.round(data.main?.temp ?? 25),
      humidity: data.main?.humidity ?? 55,
      uvIndex,
      description: data.weather?.[0]?.description ?? "Clear",
      city: data.name ?? city,
    };
  } catch {
    return getFallbackWeather(city);
  }
}

function getFallbackWeather(city: string): WeatherData {
  return { temperature: 25, humidity: 55, uvIndex: 5, description: "Clear", city };
}

export interface WeatherAlert {
  id: string;
  emoji: string;
  message: string;
  severity: "high" | "medium" | "low";
}

export function buildWeatherAlerts(weather: WeatherData): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const hour = new Date().getHours();

  if (weather.uvIndex >= 8) {
    alerts.push({
      id: "uv-extreme",
      emoji: "🔴",
      message: `Extreme UV (${weather.uvIndex}) in ${weather.city}. Apply SPF 50+ immediately and avoid direct sun 11am–4pm.`,
      severity: "high",
    });
  } else if (weather.uvIndex >= 6) {
    alerts.push({
      id: "uv-high",
      emoji: "☀️",
      message: `High UV index (${weather.uvIndex}) in ${weather.city}. Re-apply SPF 50+ sunscreen now — every 2 hours!`,
      severity: "high",
    });
  } else if (weather.uvIndex >= 4 && hour >= 11 && hour <= 15) {
    alerts.push({
      id: "uv-midday",
      emoji: "🧴",
      message: `Midday reminder: UV is ${weather.uvIndex} in ${weather.city}. Reapply sunscreen.`,
      severity: "medium",
    });
  }

  if (weather.humidity < 30) {
    alerts.push({
      id: "humidity-verylow",
      emoji: "💧",
      message: `Very low humidity (${weather.humidity}%) in ${weather.city}. Add a hydrating serum to your evening routine.`,
      severity: "medium",
    });
  } else if (weather.humidity >= 30 && weather.humidity <= 40) {
    alerts.push({
      id: "humidity-low",
      emoji: "💦",
      message: `Low humidity today. Layer a hydrating toner after cleansing.`,
      severity: "low",
    });
  }

  // Time-based reminders (only if no weather alerts)
  if (alerts.length === 0) {
    if (hour >= 6 && hour <= 10) {
      alerts.push({
        id: "morning",
        emoji: "☀️",
        message: "Good morning! Time for your AM skincare routine.",
        severity: "low",
      });
    } else if (hour >= 19 && hour <= 22) {
      alerts.push({
        id: "evening",
        emoji: "🌙",
        message: "Evening reminder: don't skip your PM routine.",
        severity: "low",
      });
    }
  }

  return alerts;
}
