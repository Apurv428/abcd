"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import { User, Save, CheckCircle } from "lucide-react";

const SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"];
const CONCERN_OPTIONS = [
    "acne", "dark spots", "fine lines", "wrinkles", "dryness",
    "oiliness", "sensitivity", "large pores", "dullness",
    "uneven tone", "dehydration", "sun damage", "redness", "dark circles",
];

export default function ProfilePage() {
    const [fullName, setFullName] = useState("");
    const [skinType, setSkinType] = useState("");
    const [age, setAge] = useState("");
    const [location, setLocation] = useState("");
    const [concerns, setConcerns] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profile) {
                setFullName(profile.full_name || "");
                setSkinType(profile.skin_type || "");
                setAge(profile.age?.toString() || "");
                setLocation(profile.location || "");
                setConcerns(profile.concerns || []);
            }
            setLoading(false);
        }
        load();
    }, []);

    const toggleConcern = (concern: string) => {
        setConcerns((prev) =>
            prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("profiles").upsert({
            id: user.id,
            full_name: fullName,
            skin_type: skinType || null,
            age: age ? parseInt(age) : null,
            location: location || null,
            concerns,
        });

        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (loading) {
        return (
            <div className="animate-fade-in">
                <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "24px" }}>Profile</h1>
                <div className="loading-shimmer" style={{ height: "400px", borderRadius: "16px" }} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Profile</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Personalize your skincare experience</p>
            </div>

            <div style={{ maxWidth: "600px" }}>
                <GlassCard hover={false}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                        <div style={{
                            width: "56px", height: "56px", borderRadius: "50%",
                            background: "var(--gradient-primary)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                        }}>
                            <User size={26} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontWeight: 600, fontSize: "1.1rem" }}>{fullName || "Your Name"}</h2>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{skinType ? `${skinType} skin` : "Set your skin type below"}</p>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <GlassInput
                            id="fullName"
                            label="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Jane Doe"
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <GlassInput
                                id="age"
                                label="Age"
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="25"
                            />
                            <GlassInput
                                id="location"
                                label="Location (for weather)"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="New York"
                            />
                        </div>

                        {/* Skin Type */}
                        <div>
                            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                                Skin Type
                            </label>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {SKIN_TYPES.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSkinType(type)}
                                        style={{
                                            padding: "8px 18px", borderRadius: "10px", cursor: "pointer",
                                            border: `1px solid ${skinType === type ? "var(--accent-purple)" : "var(--glass-border)"}`,
                                            background: skinType === type ? "rgba(168, 85, 247, 0.15)" : "var(--glass-bg)",
                                            color: "var(--text-primary)", fontSize: "0.85rem", textTransform: "capitalize",
                                            fontFamily: "Inter", fontWeight: skinType === type ? 600 : 400,
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Concerns */}
                        <div>
                            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                                Skin Concerns (select all that apply)
                            </label>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {CONCERN_OPTIONS.map((concern) => (
                                    <button
                                        key={concern}
                                        type="button"
                                        onClick={() => toggleConcern(concern)}
                                        style={{
                                            padding: "6px 14px", borderRadius: "8px", cursor: "pointer",
                                            border: `1px solid ${concerns.includes(concern) ? "var(--accent-teal)" : "var(--glass-border)"}`,
                                            background: concerns.includes(concern) ? "rgba(20, 184, 166, 0.15)" : "var(--glass-bg)",
                                            color: "var(--text-primary)", fontSize: "0.8rem", textTransform: "capitalize",
                                            fontFamily: "Inter", transition: "all 0.2s",
                                        }}
                                    >
                                        {concern}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <GlassButton onClick={handleSave} loading={saving}>
                                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Save size={16} /> Save Profile
                                </span>
                            </GlassButton>
                            {saved && (
                                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#22c55e", fontSize: "0.85rem" }}>
                                    <CheckCircle size={16} /> Saved!
                                </span>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
