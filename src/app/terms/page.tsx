import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-purple)", textDecoration: "none", fontSize: "0.9rem", marginBottom: "24px" }}>
                <ArrowLeft size={16} /> Back to home
            </Link>

            <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "8px" }}>Terms of Service</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "32px" }}>Last updated: February 2026</p>

            <div style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.95rem" }}>
                <div className="disclaimer-banner" style={{ marginBottom: "24px", textAlign: "left" }}>
                    <strong>⚕️ Important:</strong> SkinExpert AI is classified as a <strong>General Wellness Product</strong> under applicable regulations. It does not diagnose, treat, cure, or prevent any disease or medical condition. Always seek the advice of a qualified dermatologist or healthcare provider.
                </div>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>1. Acceptance of Terms</h2>
                <p>By accessing or using SkinExpert AI (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>2. Nature of the Service</h2>
                <p>SkinExpert AI provides AI-generated skincare analysis and recommendations for general wellness purposes only. The Service uses artificial intelligence models which may produce inaccurate or incomplete results. You acknowledge that:</p>
                <ul style={{ paddingLeft: "24px", margin: "12px 0" }}>
                    <li>Results are not medical diagnoses</li>
                    <li>AI analysis is probabilistic and may contain errors</li>
                    <li>Product recommendations may include affiliate links</li>
                    <li>You should always consult a licensed dermatologist for medical concerns</li>
                </ul>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>3. Privacy & Image Data</h2>
                <p>Uploaded images are processed to provide skin analysis. We offer the FaceDefender™ feature to anonymize images before processing. See our <Link href="/privacy" style={{ color: "var(--accent-purple)" }}>Privacy Policy</Link> for full details.</p>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>4. Limitation of Liability</h2>
                <p>SkinExpert AI and its creators shall not be liable for any decisions made based on the Service&apos;s output, including but not limited to skincare routines, product purchases, or health-related decisions.</p>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>5. Affiliate Disclosure</h2>
                <p>Some product recommendations contain affiliate links to Amazon, Sephora, and other retailers. We may earn a commission on purchases made through these links at no extra cost to you.</p>
            </div>
        </div>
    );
}
