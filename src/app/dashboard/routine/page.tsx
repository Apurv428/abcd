"use client";

import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { Sun, Moon, CloudRain, Thermometer, Droplets, RefreshCw } from "lucide-react";

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
    const [morningSteps, setMorningSteps] = useState<RoutineStep[]>([]);
    const [eveningSteps, setEveningSteps] = useState<RoutineStep[]>([]);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"morning" | "evening">("morning");
    const [generated, setGenerated] = useState(false);

    const generateRoutine = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/routine", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setMorningSteps(data.morning?.steps || []);
            setEveningSteps(data.evening?.steps || []);
            setWeather(data.weather || null);
            setGenerated(true);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const steps = activeTab === "morning" ? morningSteps : eveningSteps;

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>My Skincare Routine</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Personalized and weather-adaptive daily routine</p>
            </div>

            {!generated ? (
                <GlassCard hover={false}>
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🧴</div>
                        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>Generate Your Routine</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto 24px", lineHeight: 1.6 }}>
                            Our AI will analyze your skin profile AND local weather to create personalized morning & evening routines.
                        </p>
                        <GlassButton onClick={generateRoutine} loading={loading}>
                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <RefreshCw size={16} /> Generate My Routine
                            </span>
                        </GlassButton>
                    </div>
                </GlassCard>
            ) : (
                <>
                    {/* Weather Context */}
                    {weather && (
                        <GlassCard hover={false} className="animate-slide-up">
                            <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <CloudRain size={18} color="var(--accent-blue)" />
                                    <span style={{ fontSize: "0.9rem" }}>{weather.city} — {weather.description}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Thermometer size={16} color="var(--accent-pink)" />
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{weather.temperature}°C</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Droplets size={16} color="var(--accent-teal)" />
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{weather.humidity}% humidity</span>
                                </div>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "6px",
                                    background: weather.uvIndex >= 6 ? "rgba(239, 68, 68, 0.15)" : "rgba(234, 179, 8, 0.15)",
                                    padding: "4px 12px", borderRadius: "8px",
                                }}>
                                    <Sun size={16} color={weather.uvIndex >= 6 ? "#ef4444" : "#eab308"} />
                                    <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>UV {weather.uvIndex}</span>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {/* Tabs */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "20px", marginBottom: "20px" }}>
                        <button
                            onClick={() => setActiveTab("morning")}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "12px 24px", borderRadius: "12px", cursor: "pointer",
                                background: activeTab === "morning" ? "rgba(245, 158, 11, 0.2)" : "var(--glass-bg)",
                                border: `1px solid ${activeTab === "morning" ? "rgba(245, 158, 11, 0.4)" : "var(--glass-border)"}`,
                                color: "var(--text-primary)", fontWeight: activeTab === "morning" ? 600 : 400,
                                fontFamily: "Inter", fontSize: "0.9rem", transition: "all 0.2s",
                            }}
                        >
                            <Sun size={18} color="#f59e0b" /> Morning Routine
                        </button>
                        <button
                            onClick={() => setActiveTab("evening")}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "12px 24px", borderRadius: "12px", cursor: "pointer",
                                background: activeTab === "evening" ? "rgba(99, 102, 241, 0.2)" : "var(--glass-bg)",
                                border: `1px solid ${activeTab === "evening" ? "rgba(99, 102, 241, 0.4)" : "var(--glass-border)"}`,
                                color: "var(--text-primary)", fontWeight: activeTab === "evening" ? 600 : 400,
                                fontFamily: "Inter", fontSize: "0.9rem", transition: "all 0.2s",
                            }}
                        >
                            <Moon size={18} color="#6366f1" /> Evening Routine
                        </button>
                    </div>

                    {/* Steps */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {steps.map((step, i) => (
                            <GlassCard key={i} hover={false} className="animate-slide-up" >
                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{
                                        width: "50px", height: "50px", borderRadius: "14px",
                                        background: activeTab === "morning"
                                            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.2))"
                                            : "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "1.5rem", flexShrink: 0,
                                    }}>
                                        {step.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                                                Step {step.order}: {step.name}
                                            </span>
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--glass-bg)", padding: "3px 10px", borderRadius: "6px" }}>
                                                {step.duration}
                                            </span>
                                        </div>
                                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    <div style={{ marginTop: "20px" }}>
                        <GlassButton variant="secondary" onClick={generateRoutine} loading={loading}>
                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <RefreshCw size={16} /> Regenerate Routine
                            </span>
                        </GlassButton>
                    </div>
                </>
            )}
        </div>
    );
}
