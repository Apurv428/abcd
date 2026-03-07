import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-purple)", textDecoration: "none", fontSize: "0.9rem", marginBottom: "24px" }}>
                <ArrowLeft size={16} /> Back to home
            </Link>

            <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "8px" }}>Privacy Policy</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "32px" }}>Last updated: February 2026</p>

            <div style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.95rem" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>1. Information We Collect</h2>
                <ul style={{ paddingLeft: "24px", margin: "12px 0" }}>
                    <li><strong>Account Data:</strong> Email, name, and profile information you provide</li>
                    <li><strong>Skin Images:</strong> Photos you upload for analysis</li>
                    <li><strong>Analysis Data:</strong> AI-generated skin assessments and scores</li>
                    <li><strong>Journal Data:</strong> Notes, moods, and progress photos</li>
                    <li><strong>Usage Data:</strong> How you interact with the app</li>
                </ul>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>2. FaceDefender™ Privacy Feature</h2>
                <p>We provide the FaceDefender™ feature that automatically applies a privacy mask to anonymize the eye region of uploaded photos. This masking occurs <strong>client-side, before</strong> the image is sent to our servers or any AI model. You may opt out of this feature, in which case the original image will be processed.</p>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>3. How We Use Your Data</h2>
                <ul style={{ paddingLeft: "24px", margin: "12px 0" }}>
                    <li>To provide AI-powered skin analysis</li>
                    <li>To generate personalized skincare routines</li>
                    <li>To recommend suitable products</li>
                    <li>To track your skincare progress over time</li>
                    <li>We do <strong>not</strong> sell your personal data or images</li>
                </ul>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>4. Third-Party Services</h2>
                <p>We use the following third-party services:</p>
                <ul style={{ paddingLeft: "24px", margin: "12px 0" }}>
                    <li><strong>Supabase:</strong> Authentication and database storage</li>
                    <li><strong>Google Gemini AI:</strong> Skin image analysis (images are sent to Google&apos;s API)</li>
                    <li><strong>OpenWeatherMap:</strong> Weather data for routine adjustment</li>
                </ul>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>5. Data Retention & Deletion</h2>
                <p>You may request deletion of your account and all associated data at any time by contacting us. Your data is stored securely in Supabase with Row Level Security policies ensuring only you can access your own data.</p>

                <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-primary)", margin: "24px 0 12px" }}>6. Contact</h2>
                <p>For privacy inquiries, please contact us at privacy@skinexpert.ai.</p>
            </div>
        </div>
    );
}
