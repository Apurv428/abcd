import Link from "next/link";

export default function TermsPage() {
  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "60px 24px" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "24px" }}>Terms of Service</h1>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.8 }}>
        <p><strong>Last Updated:</strong> March 2026</p>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.2rem", margin: "28px 0 12px" }}>1. General Wellness Disclaimer</h2>
        <p>DermAgent AI is a <strong>general wellness product</strong>. It does not provide medical diagnosis, treatment, or professional dermatological advice. The AI analysis is intended for informational and educational purposes only. Always consult a licensed dermatologist or healthcare provider for medical skin concerns.</p>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.2rem", margin: "28px 0 12px" }}>2. AI Accuracy</h2>
        <p>While our AI strives for accuracy, skin analysis results are estimates and should not replace professional medical evaluation. Results may vary based on image quality, lighting, and other factors.</p>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.2rem", margin: "28px 0 12px" }}>3. Acceptable Use</h2>
        <p>You agree to use DermAgent AI only for its intended purpose of personal skincare tracking and education. You must be at least 13 years old to use this service.</p>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.2rem", margin: "28px 0 12px" }}>4. Product Recommendations</h2>
        <p>Product recommendations may include affiliate links. DermAgent AI is not responsible for the quality, suitability, or availability of third-party products. Always patch-test new products before full application.</p>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.2rem", margin: "28px 0 12px" }}>5. Data and Account</h2>
        <p>You retain ownership of your data. You can delete your account and associated data at any time through your profile settings or by contacting support.</p>
      </div>
      <Link href="/" style={{ color: "var(--accent-teal)", textDecoration: "none", display: "inline-block", marginTop: "32px" }}>← Back to Home</Link>
    </div>
  );
}
