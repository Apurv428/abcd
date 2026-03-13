"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronRight, ChevronLeft, Check, MapPin, Loader2 } from "lucide-react";
import { getCityFromCoords } from "@/lib/weather";

const SKIN_TYPES = [
  { value: "oily", label: "Oily", emoji: "💧", desc: "Shiny, enlarged pores" },
  { value: "dry", label: "Dry", emoji: "🏜️", desc: "Tight, flaky patches" },
  { value: "combination", label: "Combination", emoji: "⚖️", desc: "Oily T-zone, dry cheeks" },
  { value: "normal", label: "Normal", emoji: "✨", desc: "Balanced, few issues" },
  { value: "sensitive", label: "Sensitive", emoji: "🌸", desc: "Reacts easily, redness" },
];

const CONCERN_OPTIONS = [
  "Acne & Breakouts", "Dark Spots & Hyperpigmentation", "Fine Lines & Wrinkles",
  "Redness & Rosacea", "Large Pores", "Oiliness & Shine", "Dryness & Flaking",
  "Sensitivity & Irritation", "Dullness & Uneven Tone", "Dark Circles",
  "Sagging & Loss of Firmness", "Sun Damage",
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Step 1
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  // Step 2
  const [skinType, setSkinType] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [sensitivity, setSensitivity] = useState(3);

  // Step 3
  const [waterIntake, setWaterIntake] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sunExposure, setSunExposure] = useState("");
  const [hasRoutine, setHasRoutine] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");

  useEffect(() => {
    async function loadExisting() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profile) {
        setFullName(profile.full_name || "");
      }
    }
    loadExisting();

    // Auto-detect location
    const detectLocation = async () => {
      if (!navigator.geolocation) return;
      setLocLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { city: detCity, country: detCountry } = await getCityFromCoords(
              pos.coords.latitude,
              pos.coords.longitude
            );
            setCity(detCity);
            setCountry(detCountry);
          } catch (err) {
            console.error("Location detection error:", err);
          } finally {
            setLocLoading(false);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          setLocLoading(false);
        },
        { timeout: 10000 }
      );
    };
    detectLocation();
  }, []);

  const toggleConcern = (c: string) => {
    setConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : prev.length < 5 ? [...prev, c] : prev
    );
  };

  const canProceed = () => {
    if (step === 1) return fullName.trim() && age && gender;
    if (step === 2) return skinType && concerns.length > 0;
    return true;
  };

  const handleComplete = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      age: parseInt(age),
      gender,
      city: city || null,
      country: country || null,
      skin_type: skinType,
      concerns,
      sensitivity_level: sensitivity,
      water_intake: waterIntake || null,
      sleep_hours: sleepHours || null,
      sun_exposure: sunExposure || null,
      has_routine: hasRoutine || null,
      allergies: allergies || null,
      medications: medications || null,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Onboarding save error:", error);
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  };

  const chipStyle = (selected: boolean, color = "var(--accent-teal)") => ({
    padding: "8px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    border: `1px solid ${selected ? color : "var(--glass-border)"}`,
    background: selected ? `${color}18` : "var(--glass-bg)",
    color: "var(--text-primary)",
    fontSize: "0.85rem",
    fontFamily: "var(--font-body)",
    fontWeight: selected ? 600 : 400,
    transition: "all 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="glass-card-static animate-fade-in" style={{ width: "100%", maxWidth: "560px", padding: "40px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "50px", height: "50px", borderRadius: "14px",
            background: "var(--gradient-brand)", display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
          }}>
            <Sparkles size={24} color="white" />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "4px" }}>
            {step === 1 ? "Personal Details" : step === 2 ? "Your Skin Profile" : "Lifestyle Factors"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Step {step} of 3 — {step === 1 ? "Tell us about yourself" : step === 2 ? "Help us understand your skin" : "Fine-tune your recommendations"}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar" style={{ marginBottom: "28px" }}>
          <div className="progress-bar-fill" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Full Name *</label>
              <input className="glass-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Age *</label>
                <input className="glass-input" type="number" min="13" max="80" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" required />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Gender *</label>
                <select className="glass-input" value={gender} onChange={(e) => setGender(e.target.value)} style={{ cursor: "pointer" }}>
                  <option value="">Select...</option>
                  {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>
            <div className="glass-card-static" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.03)" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: "var(--accent-teal-glass)", display: "flex",
                alignItems: "center", justifyContent: "center", color: "var(--accent-teal)",
              }}>
                {locLoading ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Detected Location</p>
                <p style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  {locLoading ? "Detecting..." : city ? `${city}, ${country}` : "Location not detected"}
                </p>
              </div>
              {!locLoading && !city && (
                <button
                  type="button"
                  onClick={() => {
                    setLocLoading(true);
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        const { city: c, country: ctr } = await getCityFromCoords(pos.coords.latitude, pos.coords.longitude);
                        setCity(c); setCountry(ctr); setLocLoading(false);
                      },
                      () => setLocLoading(false)
                    );
                  }}
                  style={{
                    background: "none", border: "none", color: "var(--accent-teal)",
                    fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "10px" }}>Skin Type *</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                {SKIN_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setSkinType(t.value)} style={{
                    ...chipStyle(skinType === t.value),
                    display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 8px", gap: "4px",
                  }}>
                    <span style={{ fontSize: "1.3rem" }}>{t.emoji}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.label}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>
                Primary Concerns * <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>(up to 5)</span>
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {CONCERN_OPTIONS.map((c) => (
                  <button key={c} type="button" onClick={() => toggleConcern(c)} style={chipStyle(concerns.includes(c), "var(--accent-lavender)")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "10px" }}>
                Sensitivity Level: <strong style={{ color: "var(--accent-teal)" }}>
                  {sensitivity === 1 ? "Not sensitive" : sensitivity === 2 ? "Slightly" : sensitivity === 3 ? "Moderate" : sensitivity === 4 ? "Quite sensitive" : "Very sensitive"}
                </strong>
              </label>
              <input
                type="range" min="1" max="5" value={sensitivity}
                onChange={(e) => setSensitivity(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-teal)" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                <span>1 — Not sensitive</span><span>5 — Very sensitive</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Daily Water Intake</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["< 1L", "1-2L", "2-3L", "3L+"].map((v) => (
                  <button key={v} type="button" onClick={() => setWaterIntake(v)} style={chipStyle(waterIntake === v)}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Sleep Hours per Night</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["< 5", "5-6", "7-8", "8+"].map((v) => (
                  <button key={v} type="button" onClick={() => setSleepHours(v)} style={chipStyle(sleepHours === v)}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Sun Exposure</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["Rarely (indoors)", "Moderate", "High", "Work outdoors"].map((v) => (
                  <button key={v} type="button" onClick={() => setSunExposure(v)} style={chipStyle(sunExposure === v)}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Current Skincare Routine?</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {["Yes", "No", "Sometimes"].map((v) => (
                  <button key={v} type="button" onClick={() => setHasRoutine(v)} style={chipStyle(hasRoutine === v)}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Allergies or Ingredients to Avoid</label>
              <input className="glass-input" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g., Fragrance, Parabens (optional)" />
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Current Medications (Skin-Related)</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["Retinoids", "Antibiotics", "Accutane", "None", "Other"].map((v) => (
                  <button key={v} type="button" onClick={() => setMedications(v)} style={chipStyle(medications === v)}>{v}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", gap: "12px" }}>
          {step > 1 ? (
            <button className="glass-button-secondary" onClick={() => setStep(step - 1)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ChevronLeft size={16} /> Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              className="glass-button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="glass-button"
              onClick={handleComplete}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              {saving ? <span className="spinner" /> : <><Check size={16} /> Complete Setup</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
