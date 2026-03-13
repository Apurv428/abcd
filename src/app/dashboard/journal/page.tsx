"use client";

import { useState, useEffect, Suspense } from "react";
import { BookOpen, Plus, SmilePlus, TrendingUp, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useSearchParams } from "next/navigation";

interface JournalEntry {
  id: string; notes: string; mood: string;
  skin_score: number | null; created_at: string;
}

const MOODS = [
  { value: "great", emoji: "😄", label: "Great", color: "#22c55e" },
  { value: "good", emoji: "🙂", label: "Good", color: "#2dd4bf" },
  { value: "okay", emoji: "😐", label: "Okay", color: "#eab308" },
  { value: "bad", emoji: "😕", label: "Bad", color: "#f97316" },
  { value: "terrible", emoji: "😢", label: "Terrible", color: "#ef4444" },
];

function JournalContent() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState("good");
  const [skinScore, setSkinScore] = useState("");
  const [saving, setSaving] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    loadEntries();
    const preScore = searchParams.get("score");
    if (preScore) { setSkinScore(preScore); setShowForm(true); }
  }, []);

  async function loadEntries() {
    try {
      const res = await fetch("/api/journal");
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, mood, skinScore: skinScore ? parseInt(skinScore) : null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setNotes(""); setMood("good"); setSkinScore(""); setShowForm(false);
      loadEntries();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this journal entry? This cannot be undone.")) return;
    try {
      await fetch(`/api/journal?id=${id}`, { method: "DELETE" });
      setEntries(entries.filter((e) => e.id !== id));
    } catch (err) { console.error(err); }
  };

  const chartData = entries.filter((e) => e.skin_score != null).reverse().map((e) => ({
    date: format(new Date(e.created_at), "MMM d"), score: e.skin_score,
  }));

  const getMood = (value: string) => MOODS.find((m) => m.value === value);

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Skin Journal</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track your skincare progress over time</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="glass-button" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} /> New Entry
        </button>
      </div>

      {/* New Entry Form */}
      {showForm && (
        <div className="glass-card-static animate-slide-up" style={{ padding: "24px", marginBottom: "20px" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <SmilePlus size={18} /> How&apos;s your skin today?
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Mood</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {MOODS.map((m) => (
                  <button key={m.value} type="button" onClick={() => setMood(m.value)} style={{
                    padding: "10px 16px", borderRadius: "12px", cursor: "pointer",
                    border: `1px solid ${mood === m.value ? m.color : "var(--glass-border)"}`,
                    background: mood === m.value ? `${m.color}18` : "var(--glass-bg)",
                    fontSize: "1.3rem", transition: "all 0.2s",
                  }} title={m.label}>
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>
                Skin Score (0-100, optional)
              </label>
              <input className="glass-input" type="number" min="0" max="100" placeholder="e.g. 75" value={skinScore} onChange={(e) => setSkinScore(e.target.value)} style={{ maxWidth: "200px" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Notes</label>
              <textarea className="glass-input" placeholder="How does your skin feel today? Any changes you noticed?" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ resize: "vertical" }} required />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowForm(false)} className="glass-button-secondary">Cancel</button>
              <button type="submit" className="glass-button" disabled={saving}>{saving ? <span className="spinner" /> : "Save Entry"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Progress Chart */}
      {chartData.length >= 2 && (
        <div className="glass-card-static animate-slide-up" style={{ padding: "24px", marginBottom: "20px" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={18} color="var(--accent-teal)" /> Skin Score Trend
          </h3>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{
                  background: "rgba(10, 10, 26, 0.95)", border: "1px solid var(--glass-border)",
                  borderRadius: "8px", color: "var(--text-primary)",
                }} />
                <Line type="monotone" dataKey="score" stroke="var(--accent-teal)" strokeWidth={2} dot={{ fill: "var(--accent-teal)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Entries Timeline */}
      <h3 style={{ fontWeight: 600, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
        <BookOpen size={18} /> Journal Entries
      </h3>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2, 3].map((i) => <div key={i} className="loading-shimmer" style={{ height: "100px", borderRadius: "16px" }} />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card-static" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📔</div>
          <h3 style={{ fontWeight: 600, marginBottom: "8px" }}>No journal entries yet</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>Start tracking your skin journey!</p>
          <button onClick={() => setShowForm(true)} className="glass-button">Write Your First Entry</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {entries.map((entry) => {
            const m = getMood(entry.mood);
            return (
              <div key={entry.id} className="glass-card-static" style={{ padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "1.4rem" }}>{m?.emoji}</span>
                      <span style={{ color: m?.color, fontWeight: 600, fontSize: "0.85rem" }}>{m?.label}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      {entry.skin_score != null && (
                        <span style={{ background: "rgba(45, 212, 191, 0.12)", padding: "2px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, color: "var(--accent-teal)" }}>
                          Score: {entry.skin_score}
                        </span>
                      )}
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{entry.notes}</p>
                  </div>
                  <button onClick={() => handleDelete(entry.id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", padding: "4px", transition: "color 0.2s",
                  }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")} title="Delete entry">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  return <Suspense fallback={<div className="loading-shimmer" style={{ height: "300px", borderRadius: "16px" }} />}><JournalContent /></Suspense>;
}
