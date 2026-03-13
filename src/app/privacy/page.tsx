import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "60px 24px" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "24px" }}>Privacy Policy</h1>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.8 }}>
        <p><strong>Last Updated:</strong> March 2026</p>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.2rem", margin: "28px 0 12px" }}>1. Data Collection</h2>
        <p>DermAgent AI collects the following data to personalize your experience:</p>
        <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
          <li>Account information (name, email)</li>
          <li>Skin profile data (skin type, concerns, lifestyle factors)</li>
          <li>Uploaded skin images (processed by Google Gemini AI)</li>
          <li>Journal entries and product shelf data</li>
          <li>Location data (for weather-based recommendations, with your permission)</li>
        </ul>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.2rem", margin: "28px 0 12px" }}>2. FaceDefender™ Privacy</h2>
        <p>Our FaceDefender™ technology anonymizes the eye region of uploaded photos <strong>client-side</strong> before any data is transmitted. The original unmasked image never leaves your device when FaceDefender™ is enabled.</p>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.2rem", margin: "28px 0 12px" }}>3. Data Storage</h2>
        <p>All data is stored securely in Supabase with Row Level Security (RLS), ensuring only you can access your data. We do not sell or share personal data with third parties.</p>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.2rem", margin: "28px 0 12px" }}>4. AI Processing</h2>
        <p>Skin images are processed using Google Gemini AI. Google&apos;s API processes the images in real-time and does not retain them after analysis.</p>

        <h2 style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.2rem", margin: "28px 0 12px" }}>5. Contact</h2>
        <p>For privacy inquiries, please contact us at privacy@dermagent.ai.</p>
      </div>
      <Link href="/" style={{ color: "var(--accent-teal)", textDecoration: "none", display: "inline-block", marginTop: "32px" }}>← Back to Home</Link>
    </div>
  );
}
