"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import { Sparkles, Mail, Lock, Chrome } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
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
                    <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "6px" }}>Welcome back</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Sign in to your DermAgent AI account</p>
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

                    {/* Email/Password Form */}
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                                <Lock size={16} /> Sign In
                            </span>
                        </GlassButton>
                    </form>

                    <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Don&apos;t have an account?{" "}
                        <Link href="/register" style={{ color: "var(--accent-purple)", textDecoration: "none", fontWeight: 500 }}>
                            Sign up
                        </Link>
                    </p>
                </GlassCard>
            </div>
        </div>
    );
}
