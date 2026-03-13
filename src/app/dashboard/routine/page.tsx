"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Sun, Moon, CloudRain, Droplets, Zap, MapPin, Loader2 } from "lucide-react";

interface RoutineStep {
  order: number;
  name: string;
  icon: string;
  description: string;
  duration: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  uvIndex: number;
  description: string;
  city: string;
}

export default function RoutinePage() {
  const [morning, setMorning] = useState<RoutineStep[]>([]);
  const [evening, setEvening] = useState<RoutineStep[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [activeTab, setActiveTab] = useState<"morning" | "evening">("morning");
  const [loading, setLoading] = useState(false);
  const [hasRoutine, setHasRoutine] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadExisting();
  }, []);

  async function loadExisting() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: routines } = await supabase
      .from("routines").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(2);

    if (routines && routines.length > 0) {
      const morningRoutine = routines.find((r) => r.type === "morning");
      const eveningRoutine = routines.find((r) => r.type === "evening");
      if (morningRoutine) {
        setMorning(morningRoutine.steps_json?.steps || morningRoutine.steps_json || []);
        setWeather(morningRoutine.weather_context_json);
      }
      if (eveningRoutine) setEvening(eveningRoutine.steps_json?.steps || eveningRoutine.steps_json || []);
      if (morningRoutine || eveningRoutine) setHasRoutine(true);
    }
  }

  const generateRoutine = async () => {
    setLoading(true);
    try {
      let lat, lon;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch { /* fallback to profile city */ }

      const res = await fetch("/api/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMorning(data.morning?.steps || data.morning || []);
      setEvening(data.evening?.steps || data.evening || []);
      setWeather(data.weather);
      setHasRoutine(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getUVColor = (uv: number) => {
    if (uv >= 8) return "#ef4444";
    if (uv >= 6) return "#f59e0b";
    if (uv >= 4) return "#eab308";
    return "#22c55e";
  };

  const steps = activeTab === "morning" ? morning : evening;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>My Routine</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Personalized routine based on your skin & weather</p>
        </div>
        <button onClick={generateRoutine} disabled={loading} className="glass-button" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {loading ? <span className="spinner" /> : <><Zap size={16} /> Generate Routine</>}
        </button>
      </div>

      {/* Weather Card */}
      {weather && (
        <div className="glass-card-static animate-slide-up" style={{ padding: "18px 22px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={14} color="var(--accent-teal)" />
              <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>{weather.city}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CloudRain size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{weather.temperature}°C, {weather.description}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Droplets size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{weather.humidity}%</span>
            </div>
            <span style={{
              background: `${getUVColor(weather.uvIndex)}18`,
              color: getUVColor(weather.uvIndex),
              padding: "3px 12px", borderRadius: "6px",
              fontSize: "0.8rem", fontWeight: 700,
              border: `1px solid ${getUVColor(weather.uvIndex)}30`,
            }}>
              UV {weather.uvIndex}
            </span>
          </div>
        </div>
      )}

      {!hasRoutine && !loading && (
        <div className="glass-card-static" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🧴</div>
          <h2 style={{ fontWeight: 600, fontSize: "1.3rem", marginBottom: "8px" }}>No Routine Yet</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "24px" }}>
            Generate a personalized skincare routine based on your skin type and current weather conditions.
          </p>
          <button onClick={generateRoutine} className="glass-button">Generate My Routine</button>
        </div>
      )}

      {hasRoutine && (
        <>
          {/* Tab Switcher */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button
              onClick={() => setActiveTab("morning")}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 24px", borderRadius: "12px", cursor: "pointer",
                border: `1px solid ${activeTab === "morning" ? "var(--accent-teal)" : "var(--glass-border)"}`,
                background: activeTab === "morning" ? "rgba(45, 212, 191, 0.12)" : "var(--glass-bg)",
                color: activeTab === "morning" ? "var(--accent-teal)" : "var(--text-secondary)",
                fontWeight: activeTab === "morning" ? 700 : 400, fontSize: "0.9rem",
                fontFamily: "var(--font-body)", transition: "all 0.2s",
              }}
            >
              <Sun size={18} /> Morning
            </button>
            <button
              onClick={() => setActiveTab("evening")}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 24px", borderRadius: "12px", cursor: "pointer",
                border: `1px solid ${activeTab === "evening" ? "var(--accent-lavender)" : "var(--glass-border)"}`,
                background: activeTab === "evening" ? "rgba(167, 139, 250, 0.12)" : "var(--glass-bg)",
                color: activeTab === "evening" ? "var(--accent-lavender)" : "var(--text-secondary)",
                fontWeight: activeTab === "evening" ? 700 : 400, fontSize: "0.9rem",
                fontFamily: "var(--font-body)", transition: "all 0.2s",
              }}
            >
              <Moon size={18} /> Evening
            </button>
          </div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {steps.map((step, i) => (
              <div
                key={i}
                className="glass-card-static animate-slide-up"
                style={{
                  padding: "16px 20px",
                  animationDelay: `${i * 0.07}s`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: activeTab === "morning" ? "rgba(45, 212, 191, 0.1)" : "rgba(167, 139, 250, 0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.3rem", flexShrink: 0,
                  }}>
                    {step.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>STEP {step.order}</span>
                      <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{step.name}</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>{step.description}</p>
                  </div>
                  <div style={{
                    padding: "4px 12px", borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.04)", fontSize: "0.75rem",
                    color: "var(--text-muted)", whiteSpace: "nowrap",
                  }}>
                    {step.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
