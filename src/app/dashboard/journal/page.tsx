"use client";

import { useState, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import { BookOpen, Plus, SmilePlus, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface JournalEntry {
    id: string;
    notes: string;
    mood: string;
    skin_score: number | null;
    photo_url: string | null;
    created_at: string;
}

const MOODS = [
    { value: "great", emoji: "😄", label: "Great" },
    { value: "good", emoji: "🙂", label: "Good" },
    { value: "okay", emoji: "😐", label: "Okay" },
    { value: "bad", emoji: "😟", label: "Bad" },
    { value: "terrible", emoji: "😢", label: "Terrible" },
];

export default function JournalPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [notes, setNotes] = useState("");
    const [mood, setMood] = useState("good");
    const [skinScore, setSkinScore] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadEntries();
    }, []);

    async function loadEntries() {
        try {
            const res = await fetch("/api/journal");
            const data = await res.json();
            setEntries(data.entries || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch("/api/journal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    notes,
                    mood,
                    skinScore: skinScore ? parseInt(skinScore) : null,
                }),
            });

            if (!res.ok) throw new Error("Failed to save");

            setNotes("");
            setMood("good");
            setSkinScore("");
            setShowForm(false);
            loadEntries();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const chartData = entries
        .filter((e) => e.skin_score != null)
        .reverse()
        .map((e) => ({
            date: format(new Date(e.created_at), "MMM d"),
            score: e.skin_score,
        }));

    const getMoodEmoji = (value: string) => MOODS.find((m) => m.value === value)?.emoji || "🙂";

    return (
        <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Skin Journal</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track your skincare progress over time</p>
                </div>
                <GlassButton onClick={() => setShowForm(!showForm)}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Plus size={16} /> New Entry
                    </span>
                </GlassButton>
            </div>

            {/* New Entry Form */}
            {showForm && (
                <GlassCard hover={false} className="animate-slide-up">
                    <h3 style={{ fontWeight: 600, marginBottom: "16px", fontSize: "1rem" }}>
                        <SmilePlus size={18} style={{ display: "inline", marginRight: "8px" }} />
                        How&apos;s your skin today?
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Mood Selector */}
                        <div>
                            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                                Mood
                            </label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {MOODS.map((m) => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => setMood(m.value)}
                                        style={{
                                            padding: "10px 16px", borderRadius: "12px", cursor: "pointer",
                                            border: `1px solid ${mood === m.value ? "var(--accent-purple)" : "var(--glass-border)"}`,
                                            background: mood === m.value ? "rgba(168, 85, 247, 0.15)" : "var(--glass-bg)",
                                            fontSize: "1.3rem", transition: "all 0.2s",
                                        }}
                                        title={m.label}
                                    >
                                        {m.emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <GlassInput
                            id="skinScore"
                            label="Self-Rated Skin Score (0-100, optional)"
                            type="number"
                            min="0"
                            max="100"
                            placeholder="e.g. 75"
                            value={skinScore}
                            onChange={(e) => setSkinScore(e.target.value)}
                        />

                        <div>
                            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>
                                Notes
                            </label>
                            <textarea
                                className="glass-input"
                                placeholder="How does your skin feel today? Any changes you noticed?"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                style={{ resize: "vertical" }}
                                required
                            />
                        </div>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <GlassButton variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</GlassButton>
                            <GlassButton type="submit" loading={saving}>Save Entry</GlassButton>
                        </div>
                    </form>
                </GlassCard>
            )}

            {/* Progress Chart */}
            {chartData.length >= 2 && (
                <GlassCard hover={false} className="animate-slide-up">
                    <h3 style={{ fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <TrendingUp size={18} color="var(--accent-teal)" /> Skin Score Trend
                    </h3>
                    <div style={{ height: "200px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(10, 10, 26, 0.9)",
                                        border: "1px solid var(--glass-border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                    }}
                                />
                                <Line type="monotone" dataKey="score" stroke="var(--accent-purple)" strokeWidth={2} dot={{ fill: "var(--accent-purple)", r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            )}

            {/* Entries Timeline */}
            <div style={{ marginTop: "20px" }}>
                <h3 style={{ fontWeight: 600, marginBottom: "16px", fontSize: "1rem" }}>
                    <BookOpen size={18} style={{ display: "inline", marginRight: "8px" }} />
                    Journal Entries
                </h3>

                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="loading-shimmer" style={{ height: "100px", borderRadius: "16px" }} />
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <GlassCard hover={false}>
                        <div style={{ textAlign: "center", padding: "32px" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📔</div>
                            <p style={{ color: "var(--text-secondary)" }}>No journal entries yet. Start tracking your skin journey!</p>
                        </div>
                    </GlassCard>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {entries.map((entry) => (
                            <GlassCard key={entry.id} hover={false}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                            <span style={{ fontSize: "1.4rem" }}>{getMoodEmoji(entry.mood)}</span>
                                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                                {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
                                            </span>
                                            {entry.skin_score != null && (
                                                <span style={{
                                                    background: "rgba(168, 85, 247, 0.15)", padding: "2px 10px",
                                                    borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
                                                }}>
                                                    Score: {entry.skin_score}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                            {entry.notes}
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
