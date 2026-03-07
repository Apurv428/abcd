"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X, Sun, Droplets, MapPin, AlertTriangle } from "lucide-react";

interface WeatherData {
    temperature: number;
    humidity: number;
    uvIndex: number;
    description: string;
    city: string;
}

export default function ReminderBanner() {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState<"routine" | "uv" | "humidity">("routine");
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);

    const fetchWeatherByCoords = useCallback(async (lat: number, lon: number) => {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
        if (!apiKey) return null;

        try {
            const [weatherRes, uvRes] = await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
                fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`)
            ]);

            const weatherData = await weatherRes.json();
            const uvData = await uvRes.json();

            return {
                temperature: Math.round(weatherData.main?.temp || 28),
                humidity: weatherData.main?.humidity || 65,
                uvIndex: Math.round(uvData.value || 5),
                description: weatherData.weather?.[0]?.description || "Clear",
                city: weatherData.name || "Your Location",
            };
        } catch (err) {
            console.error("Weather fetch error:", err);
            return null;
        }
    }, []);

    const checkWeatherAlerts = useCallback((data: WeatherData) => {
        // High UV Alert (UV >= 6)
        if (data.uvIndex >= 6) {
            setAlertType("uv");
            setMessage(`☀️ UV levels are HIGH (${data.uvIndex}) in ${data.city}! Remember to re-apply your SPF 50+ sunscreen now.`);
            setVisible(true);
            return;
        }

        // Low Humidity Alert (< 30%)
        if (data.humidity < 30) {
            setAlertType("humidity");
            setMessage(`💧 Low humidity (${data.humidity}%) in ${data.city}. Consider adding a hydrating serum to your evening routine.`);
            setVisible(true);
            return;
        }

        // Time-based routine reminders
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 10) {
            setAlertType("routine");
            setMessage("☀️ Good morning! Time for your AM skincare routine.");
            setVisible(true);
        } else if (hour >= 18 && hour < 22) {
            setAlertType("routine");
            setMessage("🌙 Good evening! Don't forget your PM skincare routine.");
            setVisible(true);
        } else if (hour >= 12 && hour < 14 && data.uvIndex >= 4) {
            setAlertType("uv");
            setMessage(`🧴 Midday reminder: Re-apply sunscreen! UV index is ${data.uvIndex} in ${data.city}.`);
            setVisible(true);
        }
    }, []);

    useEffect(() => {
        const getLocationAndWeather = async () => {
            setLocationLoading(true);

            // Try browser geolocation first
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        const data = await fetchWeatherByCoords(latitude, longitude);
                        if (data) {
                            setWeather(data);
                            checkWeatherAlerts(data);
                        }
                        setLocationLoading(false);
                    },
                    async () => {
                        // Fallback to IP-based location or default
                        console.log("Geolocation denied, using default alerts");
                        setLocationLoading(false);
                        
                        // Show time-based reminder as fallback
                        const hour = new Date().getHours();
                        if (hour >= 6 && hour < 10) {
                            setMessage("☀️ Good morning! Time for your AM skincare routine.");
                            setVisible(true);
                        } else if (hour >= 18 && hour < 22) {
                            setMessage("🌙 Good evening! Don't forget your PM skincare routine.");
                            setVisible(true);
                        } else if (hour >= 12 && hour < 14) {
                            setMessage("🧴 Quick reminder: Reapply sunscreen if you're outdoors!");
                            setVisible(true);
                        }
                    },
                    { timeout: 5000 }
                );
            } else {
                setLocationLoading(false);
            }
        };

        getLocationAndWeather();

        // Re-check every 30 minutes for UV changes
        const interval = setInterval(getLocationAndWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchWeatherByCoords, checkWeatherAlerts]);

    if (!visible) return null;

    const getBannerStyle = () => {
        switch (alertType) {
            case "uv":
                return {
                    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                };
            case "humidity":
                return {
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(20, 184, 166, 0.15))",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                };
            default:
                return {
                    background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15))",
                    border: "1px solid rgba(168, 85, 247, 0.25)",
                };
        }
    };

    const getIcon = () => {
        switch (alertType) {
            case "uv":
                return <Sun size={16} color="#ef4444" />;
            case "humidity":
                return <Droplets size={16} color="#3b82f6" />;
            default:
                return <Bell size={16} color="var(--accent-purple)" />;
        }
    };

    return (
        <div
            style={{
                ...getBannerStyle(),
                borderRadius: "12px",
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                animation: "slideUp 0.4s ease",
            }}
            data-testid="reminder-banner"
        >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                {getIcon()}
                <span>{message}</span>
                {weather && (
                    <span style={{
                        display: "flex", alignItems: "center", gap: "4px",
                        background: "rgba(255,255,255,0.1)", padding: "2px 8px",
                        borderRadius: "6px", fontSize: "0.75rem", color: "var(--text-muted)",
                    }}>
                        <MapPin size={12} /> {weather.city}
                    </span>
                )}
            </div>
            <button
                onClick={() => setVisible(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                data-testid="dismiss-reminder"
            >
                <X size={16} />
            </button>
        </div>
    );
}
