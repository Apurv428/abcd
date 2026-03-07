interface WeatherData {
    temperature: number;
    humidity: number;
    uvIndex: number;
    description: string;
    city: string;
}

export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || process.env.OPENWEATHERMAP_API_KEY;

    if (!apiKey || apiKey === "your_openweathermap_key") {
        return {
            temperature: 28,
            humidity: 65,
            uvIndex: 6,
            description: "Partly cloudy",
            city: "Your Location",
        };
    }

    try {
        // Get weather data using coordinates
        const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        );
        const weather = await weatherRes.json();

        // Get UV index
        let uvIndex = 5;
        try {
            const uvRes = await fetch(
                `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`
            );
            const uvData = await uvRes.json();
            uvIndex = Math.round(uvData.value ?? 5);
        } catch {
            // UV API might fail, use estimated value based on time
            const hour = new Date().getHours();
            uvIndex = hour >= 10 && hour <= 16 ? 7 : 3;
        }

        return {
            temperature: Math.round(weather.main?.temp ?? 28),
            humidity: weather.main?.humidity ?? 65,
            uvIndex,
            description: weather.weather?.[0]?.description ?? "Clear",
            city: weather.name ?? "Your Location",
        };
    } catch {
        return {
            temperature: 28,
            humidity: 65,
            uvIndex: 6,
            description: "Data unavailable",
            city: "Your Location",
        };
    }
}

export async function getWeatherData(location: string): Promise<WeatherData> {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY || process.env.OPENWEATHERMAP_API_KEY;

    if (!apiKey || apiKey === "your_openweathermap_key") {
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
        return getWeatherByCoords(lat, lon);
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
