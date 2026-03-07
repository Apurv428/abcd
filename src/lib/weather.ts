interface WeatherData {
    temperature: number;
    humidity: number;
    uvIndex: number;
    description: string;
    city: string;
}

export async function getWeatherData(location: string): Promise<WeatherData> {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

    if (!apiKey || apiKey === "your_openweathermap_key") {
        // Return mock data when API key is not configured
        return {
            temperature: 28,
            humidity: 65,
            uvIndex: 6,
            description: "Partly cloudy",
            city: location || "Your City",
        };
    }

    try {
        // Get coordinates from city name
        const geoRes = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
        );
        const geoData = await geoRes.json();

        if (!geoData.length) {
            throw new Error("Location not found");
        }

        const { lat, lon } = geoData[0];

        // Get weather data
        const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        );
        const weather = await weatherRes.json();

        // Get UV index
        const uvRes = await fetch(
            `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        const uvData = await uvRes.json();

        return {
            temperature: Math.round(weather.main.temp),
            humidity: weather.main.humidity,
            uvIndex: Math.round(uvData.value ?? 5),
            description: weather.weather?.[0]?.description ?? "Clear",
            city: weather.name ?? location,
        };
    } catch {
        return {
            temperature: 28,
            humidity: 65,
            uvIndex: 6,
            description: "Data unavailable",
            city: location || "Your City",
        };
    }
}
