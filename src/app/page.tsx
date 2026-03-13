import Link from "next/link";
import { Sparkles, ScanFace, Shield, CloudSun, Bell, ArrowRight } from "lucide-react";

const features = [
  { icon: ScanFace, title: "Gemini Vision AI", desc: "Advanced skin analysis powered by Google Gemini 2.0 Flash.", gradient: "var(--gradient-brand)" },
  { icon: Shield, title: "FaceDefender™", desc: "Privacy-first eye region anonymization before analysis.", gradient: "var(--gradient-primary)" },
  { icon: CloudSun, title: "Weather-Adaptive Routines", desc: "Skincare routines that adapt to your local UV & humidity.", gradient: "var(--gradient-secondary)" },
  { icon: Bell, title: "Live UV Alerts", desc: "Real-time sun protection reminders based on your location.", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)" },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Sticky Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px", borderBottom: "1px solid var(--glass-border)",
        background: "rgba(6, 6, 18, 0.9)", backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "11px",
            background: "var(--gradient-brand)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>DermAgent AI</span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/login" className="glass-button-secondary" style={{ textDecoration: "none", padding: "8px 20px", fontSize: "0.85rem" }}>
            Sign In
          </Link>
          <Link href="/register" className="glass-button" style={{ textDecoration: "none", padding: "8px 20px", fontSize: "0.85rem" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "100px 40px 80px", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{
          display: "inline-block", padding: "6px 18px", borderRadius: "20px",
          background: "rgba(45, 212, 191, 0.08)", border: "1px solid rgba(45, 212, 191, 0.2)",
          fontSize: "0.8rem", color: "var(--accent-teal)", fontWeight: 600,
          marginBottom: "28px",
        }}>
          ✨ Powered by Google Gemini AI
        </div>

        <h1 style={{
          fontSize: "3.2rem", fontWeight: 700, lineHeight: 1.15,
          marginBottom: "20px", fontFamily: "var(--font-heading)",
        }}>
          Your Personal{" "}
          <span style={{
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            AI Dermatologist
          </span>
        </h1>
        <p style={{
          color: "var(--text-secondary)", fontSize: "1.15rem", lineHeight: 1.7,
          maxWidth: "600px", margin: "0 auto 36px",
        }}>
          Analyze your skin with advanced AI vision, get weather-adaptive routines, and discover products tailored to your unique skin profile.
        </p>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
          <Link href="/register" className="glass-button" style={{ textDecoration: "none", padding: "14px 32px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            Start Free Analysis <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="glass-button-secondary" style={{ textDecoration: "none", padding: "14px 32px", fontSize: "1rem" }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "0 40px 80px", maxWidth: "960px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: "28px" }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "14px",
                background: f.gradient, display: "flex",
                alignItems: "center", justifyContent: "center",
                marginBottom: "16px",
              }}>
                <f.icon size={24} color="white" />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: "1.05rem", marginBottom: "6px" }}>{f.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "24px 40px", borderTop: "1px solid var(--glass-border)",
        textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)",
      }}>
        <div className="disclaimer-banner" style={{ maxWidth: "700px", margin: "0 auto 16px" }}>
          ⚕️ DermAgent AI is a general wellness product. It does not provide medical diagnosis or treatment. Always consult a licensed dermatologist.
        </div>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <Link href="/privacy" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Terms</Link>
        </div>
        <p style={{ marginTop: "8px" }}>© {new Date().getFullYear()} DermAgent AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
