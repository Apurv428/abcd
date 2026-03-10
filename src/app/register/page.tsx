"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import { Sparkles, UserPlus, Chrome } from "lucide-react";

export default function RegisterPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        // Use the actual site URL for OAuth redirect, not localhost
        const siteUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
            ? window.location.origin 
            : 'https://5170efd5-d913-4d8a-ace0-4282be6d0ba9.preview.emergentagent.com';
        
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${siteUrl}/auth/callback` },
        });
        if (error) setError(error.message);
    };

    if (success) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                <GlassCard hover={false} className="animate-fade-in" >
                    <div style={{ textAlign: "center", maxWidth: "400px", padding: "20px" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✉️</div>
                        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>Check your email</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                            We&apos;ve sent a confirmation link to <strong style={{ color: "var(--accent-purple)" }}>{email}</strong>.
                            Click the link to activate your account.
                        </p>
                    </div>
                </GlassCard>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
        }}>
            <div style={{ width: "100%", maxWidth: "440px" }} className="animate-fade-in">
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div style={{
                        width: "56px", height: "56px", borderRadius: "16px",
                        background: "var(--gradient-primary)", display: "inline-flex",
                        alignItems: "center", justifyContent: "center", marginBottom: "16px",
                    }}>
                        <Sparkles size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "6px" }}>Create your account</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Start your AI-powered skincare journey</p>
                </div>

                <GlassCard hover={false}>
                    {/* Google OAuth */}
                    <button
                        onClick={handleGoogleLogin}
                        style={{
                            width: "100%", padding: "14px", borderRadius: "12px",
                            border: "1px solid var(--glass-border)", background: "var(--glass-bg)",
                            color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 500,
                            cursor: "pointer", display: "flex", alignItems: "center",
                            justifyContent: "center", gap: "10px", transition: "all 0.2s",
                            marginBottom: "24px", fontFamily: "Inter, sans-serif",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--glass-hover)"; e.currentTarget.style.borderColor = "var(--accent-purple)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--glass-bg)"; e.currentTarget.style.borderColor = "var(--glass-border)"; }}
                    >
                        <Chrome size={20} />
                        Continue with Google
                    </button>

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                        <div style={{ flex: 1, height: "1px", background: "var(--glass-border)" }} />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>or</span>
                        <div style={{ flex: 1, height: "1px", background: "var(--glass-border)" }} />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <GlassInput
                            id="fullName"
                            label="Full Name"
                            type="text"
                            placeholder="Jane Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                        <GlassInput
                            id="email"
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <GlassInput
                            id="password"
                            label="Password"
                            type="password"
                            placeholder="••••••••  (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                        />

                        {error && (
                            <div style={{
                                background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: "8px", padding: "10px 14px", fontSize: "0.85rem", color: "#f87171",
                            }}>
                                {error}
                            </div>
                        )}

                        <GlassButton type="submit" loading={loading} style={{ width: "100%", marginTop: "8px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                                <UserPlus size={16} /> Create Account
                            </span>
                        </GlassButton>
                    </form>

                    <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Already have an account?{" "}
                        <Link href="/login" style={{ color: "var(--accent-purple)", textDecoration: "none", fontWeight: 500 }}>
                            Sign in
                        </Link>
                    </p>
                </GlassCard>

                <div className="disclaimer-banner" style={{ marginTop: "16px" }}>
                    By creating an account you agree to our Terms of Service and acknowledge that DermAgent AI is a general wellness product.
                </div>
            </div>
        </div>
    );
}
