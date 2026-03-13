"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { User, Save, CheckCircle, LogOut, MapPin, Loader2, RefreshCw } from "lucide-react";
import { getCityFromCoords } from "@/lib/weather";

const SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"];
const CONCERN_OPTIONS = [
  "Acne & Breakouts", "Dark Spots & Hyperpigmentation", "Fine Lines & Wrinkles",
  "Redness & Rosacea", "Large Pores", "Oiliness & Shine", "Dryness & Flaking",
  "Sensitivity & Irritation", "Dullness & Uneven Tone", "Dark Circles",
  "Sagging & Loss of Firmness", "Sun Damage",
];
const GENDERS = [
  { value: "male", label: "Male" }, { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" }, { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [sensitivityLevel, setSensitivityLevel] = useState(3);
  const [waterIntake, setWaterIntake] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sunExposure, setSunExposure] = useState("");
  const [hasRoutine, setHasRoutine] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) {
        setFullName(profile.full_name || "");
        setAge(profile.age?.toString() || "");
        setGender(profile.gender || "");
        setCity(profile.city || "");
        setCountry(profile.country || "");
        setSkinType(profile.skin_type || "");
        setConcerns(profile.concerns || []);
        setSensitivityLevel(profile.sensitivity_level || 3);
        setWaterIntake(profile.water_intake || "");
        setSleepHours(profile.sleep_hours || "");
        setSunExposure(profile.sun_exposure || "");
        setHasRoutine(profile.has_routine || "");
        setAllergies(profile.allergies || "");
        setMedications(profile.medications || "");
      }
      setLoading(false);

      // Auto-detect on mount if city is missing or session-first
      if (typeof window !== "undefined" && navigator.geolocation) {
        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { city: c, country: ctr } = await getCityFromCoords(pos.coords.latitude, pos.coords.longitude);
              setCity(c); setCountry(ctr);
            } finally {
              setLocLoading(false);
            }
          },
          () => setLocLoading(false),
          { timeout: 10000 }
        );
      }
    }
    load();
  }, []);

  const toggleConcern = (c: string) => {
    setConcerns((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : prev.length < 5 ? [...prev, c] : prev);
  };

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id, full_name: fullName, age: age ? parseInt(age) : null,
      gender: gender || null, city: city || null, country: country || null,
      skin_type: skinType || null, concerns, sensitivity_level: sensitivityLevel,
      water_intake: waterIntake || null, sleep_hours: sleepHours || null,
      sun_exposure: sunExposure || null, has_routine: hasRoutine || null,
      allergies: allergies || null, medications: medications || null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const chipStyle = (selected: boolean, color = "var(--accent-teal)") => ({
    padding: "7px 16px", borderRadius: "10px", cursor: "pointer",
    border: `1px solid ${selected ? color : "var(--glass-border)"}`,
    background: selected ? `${color}18` : "var(--glass-bg)",
    color: "var(--text-primary)", fontSize: "0.8rem",
    fontFamily: "var(--font-body)", fontWeight: selected ? 600 : 400,
    transition: "all 0.2s", textTransform: "capitalize" as const,
  });

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "24px" }}>Profile</h1>
        <div className="loading-shimmer" style={{ height: "500px", borderRadius: "16px" }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Profile</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Manage your skin profile and preferences</p>
      </div>

      <div style={{ maxWidth: "640px" }}>
        <div className="glass-card-static" style={{ padding: "28px" }}>
          {/* Avatar + Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: "var(--gradient-brand)", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: "1.2rem", fontWeight: 700, color: "white",
            }}>
              {getInitials(fullName)}
            </div>
            <div>
              <h2 style={{ fontWeight: 600, fontSize: "1.1rem" }}>{fullName || "Your Name"}</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{email}</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Personal */}
            <h3 style={{ fontSize: "0.85rem", color: "var(--accent-teal)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Personal</h3>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Full Name</label>
              <input className="glass-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Age</label>
                <input className="glass-input" type="number" min="13" max="80" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Gender</label>
                <select className="glass-input" value={gender} onChange={(e) => setGender(e.target.value)} style={{ cursor: "pointer" }}>
                  <option value="">Select...</option>
                  {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Location (for weather & routine)</label>
              <div className="glass-card-static" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.03)" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "8px",
                  background: "var(--accent-teal-glass)", display: "flex",
                  alignItems: "center", justifyContent: "center", color: "var(--accent-teal)",
                }}>
                  {locLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                    {locLoading ? "Detecting..." : (city && country) ? `${city}, ${country}` : city || country || "Not set"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!navigator.geolocation) return;
                    setLocLoading(true);
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        try {
                          const { city: c, country: ctr } = await getCityFromCoords(pos.coords.latitude, pos.coords.longitude);
                          setCity(c); setCountry(ctr);
                        } finally {
                          setLocLoading(false);
                        }
                      },
                      () => setLocLoading(false)
                    );
                  }}
                  className="glass-button-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}
                  disabled={locLoading}
                >
                  <RefreshCw size={14} className={locLoading ? "animate-spin" : ""} />
                  {locLoading ? "Detecting" : "Update"}
                </button>
              </div>
            </div>

            {/* Skin Profile */}
            <h3 style={{ fontSize: "0.85rem", color: "var(--accent-teal)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginTop: "8px" }}>Skin Profile</h3>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Skin Type</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {SKIN_TYPES.map((type) => (
                  <button key={type} type="button" onClick={() => setSkinType(type)} style={chipStyle(skinType === type)}>{type}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                Concerns <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>(up to 5)</span>
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {CONCERN_OPTIONS.map((c) => (
                  <button key={c} type="button" onClick={() => toggleConcern(c)} style={chipStyle(concerns.includes(c), "var(--accent-lavender)")}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>
                Sensitivity: <strong style={{ color: "var(--accent-teal)" }}>
                  {sensitivityLevel === 1 ? "Not sensitive" : sensitivityLevel === 2 ? "Slightly" : sensitivityLevel === 3 ? "Moderate" : sensitivityLevel === 4 ? "Quite sensitive" : "Very sensitive"}
                </strong>
              </label>
              <input type="range" min="1" max="5" value={sensitivityLevel} onChange={(e) => setSensitivityLevel(parseInt(e.target.value))} style={{ width: "100%", accentColor: "var(--accent-teal)" }} />
            </div>

            {/* Lifestyle */}
            <h3 style={{ fontSize: "0.85rem", color: "var(--accent-teal)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginTop: "8px" }}>Lifestyle</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Water Intake</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["< 1L", "1-2L", "2-3L", "3L+"].map((v) => (
                    <button key={v} type="button" onClick={() => setWaterIntake(v)} style={chipStyle(waterIntake === v)}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Sleep Hours</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["< 5", "5-6", "7-8", "8+"].map((v) => (
                    <button key={v} type="button" onClick={() => setSleepHours(v)} style={chipStyle(sleepHours === v)}>{v}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Sun Exposure</label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["Rarely (indoors)", "Moderate", "High", "Work outdoors"].map((v) => (
                  <button key={v} type="button" onClick={() => setSunExposure(v)} style={chipStyle(sunExposure === v)}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Current Skincare Routine?</label>
              <div style={{ display: "flex", gap: "6px" }}>
                {["Yes", "No", "Sometimes"].map((v) => (
                  <button key={v} type="button" onClick={() => setHasRoutine(v)} style={chipStyle(hasRoutine === v)}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Allergies / Ingredients to Avoid</label>
              <input className="glass-input" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g., Fragrance, Parabens" />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Current Medications</label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["Retinoids", "Antibiotics", "Accutane", "None", "Other"].map((v) => (
                  <button key={v} type="button" onClick={() => setMedications(v)} style={chipStyle(medications === v)}>{v}</button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
              <button onClick={handleSave} className="glass-button" disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {saving ? <span className="spinner" /> : <><Save size={16} /> Save Changes</>}
              </button>
              {saved && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#22c55e", fontSize: "0.85rem" }}>
                  <CheckCircle size={16} /> Saved!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          style={{
            marginTop: "20px", display: "flex", alignItems: "center", gap: "8px",
            padding: "12px 20px", borderRadius: "12px", width: "100%",
            background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)",
            color: "#f87171", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer",
            fontFamily: "var(--font-body)", justifyContent: "center", transition: "all 0.2s",
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
