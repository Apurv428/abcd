"use client";

import { useState, useEffect, useCallback } from "react";
import { getWeatherByCoords, getWeatherData, buildWeatherAlerts, type WeatherAlert } from "@/lib/weather";
import { createClient } from "@/lib/supabase";
import { X, MapPin, Sparkles } from "lucide-react";
import { getCityFromCoords } from "@/lib/weather";

interface AINudge {
  id: string;
  message: string;
  type: "location" | "time" | "weather";
  severity: "low" | "medium" | "high";
}

export default function ReminderBanner() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [aiNudges, setAiNudges] = useState<AINudge[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [city, setCity] = useState("");
  const [prevCity, setPrevCity] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      // Try geolocation first
      let weather;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        weather = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      } catch {
        // Fallback to profile city
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase.from("profiles").select("city").eq("id", user.id).single();
            if (profile?.city) {
              weather = await getWeatherData(profile.city);
            }
          }
        } catch { /* ignore */ }
      }

      if (weather) {
        // Sync with profile if detected automatically
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user && weather.city && weather.city !== "Your Location") {
            // Only update if profile city is different or missing
            const { data: profile } = await supabase.from("profiles").select("city, country").eq("id", user.id).single();
            if (profile && profile.city !== weather.city) {
              await supabase.from("profiles").update({
                city: weather.city,
                updated_at: new Date().toISOString()
              }).eq("id", user.id);
            }
          }
        } catch { /* ignore sync failure */ }
      }

      if (!weather) {
        // Time-based fallback
        weather = { temperature: 25, humidity: 55, uvIndex: 0, description: "Clear", city: "Your Location" };
      }

      setCity(weather.city);
      const newAlerts = buildWeatherAlerts(weather);
      setAlerts(newAlerts);

      // Fetch AI Nudges if city changed or initial
      if (weather.city !== prevCity) {
        try {
          const res = await fetch("/api/nudges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              weather,
              previousCity: prevCity,
              timeContext: new Date().toLocaleTimeString(),
            }),
          });
          const data = await res.json();
          if (data.nudges) {
            setAiNudges(data.nudges);
          }
          setPrevCity(weather.city);
        } catch { /* ignore AI nudge failure */ }
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));
  const visibleNudges = aiNudges.filter((n) => !dismissed.has(n.id));
  
  if (visibleAlerts.length === 0 && visibleNudges.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
      {/* AI Nudges */}
      {visibleNudges.map((nudge) => (
        <div
          key={nudge.id}
          style={{
            background: "linear-gradient(90deg, rgba(167, 139, 250, 0.08), rgba(45, 212, 191, 0.08))",
            border: "1px solid rgba(167, 139, 250, 0.2)",
            borderRadius: "12px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "0.85rem",
            animation: "slideDown 0.5s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            background: "var(--gradient-brand)",
            borderRadius: "8px",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Sparkles size={14} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ 
              fontSize: "0.65rem", 
              textTransform: "uppercase", 
              letterSpacing: "1px", 
              fontWeight: 700, 
              color: "var(--accent-lavender)",
              display: "block",
              marginBottom: "2px"
            }}>
              AI Nudge {nudge.type === 'location' ? '• Traveler Mode' : ''}
            </span>
            <span style={{ fontWeight: 500 }}>{nudge.message}</span>
          </div>
          <button
            onClick={() => dismiss(nudge.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: "2px", flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {/* Weather Alerts */}
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            background: alert.severity === "high" ? "rgba(239, 68, 68, 0.08)" :
                        alert.severity === "medium" ? "rgba(245, 158, 11, 0.08)" :
                        "rgba(45, 212, 191, 0.06)",
            border: `1px solid ${alert.severity === "high" ? "rgba(239, 68, 68, 0.2)" :
                                  alert.severity === "medium" ? "rgba(245, 158, 11, 0.2)" :
                                  "rgba(45, 212, 191, 0.15)"}`,
            borderRadius: "12px",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.85rem",
            animation: "slideDown 0.4s ease",
          }}
        >
          <span>{alert.emoji}</span>
          <span style={{ flex: 1 }}>{alert.message}</span>
          {city && (
            <span style={{
              display: "flex", alignItems: "center", gap: "4px",
              background: "rgba(255,255,255,0.04)", padding: "2px 8px",
              borderRadius: "6px", fontSize: "0.7rem", color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}>
              <MapPin size={10} /> {city}
            </span>
          )}
          <button
            onClick={() => dismiss(alert.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", padding: "2px", flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
