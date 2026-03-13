"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Sparkles, Check } from "lucide-react";

function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Pre-fill email if redirected from login
  useState(() => {
    const preEmail = searchParams.get("email");
    if (preEmail) setEmail(preEmail);
  });

  const noAccountMsg = searchParams.get("msg") === "no_account";

  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#ef4444", "#f59e0b", "#22c55e", "#2dd4bf"];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div className="glass-card-static animate-fade-in" style={{ width: "100%", maxWidth: "440px", padding: "40px", textAlign: "center" }}>
          <div
            style={{
              width: "60px", height: "60px", borderRadius: "50%",
              background: "rgba(45, 212, 191, 0.15)", display: "flex",
              alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
            }}
          >
            <Check size={28} color="var(--accent-teal)" />
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "12px" }}>
            Check your email
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "24px" }}>
            We&apos;ve sent a confirmation link to <strong style={{ color: "var(--accent-teal)" }}>{email}</strong>.
            Click the link to verify your account, then sign in.
          </p>
          <Link href="/login" className="glass-button" style={{ textDecoration: "none", display: "inline-block" }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="glass-card-static animate-fade-in" style={{ width: "100%", maxWidth: "440px", padding: "40px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "50px", height: "50px", borderRadius: "14px",
              background: "var(--gradient-brand)", display: "flex",
              alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}
          >
            <Sparkles size={24} color="white" />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "6px" }}>Create Account</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Start your skincare journey with DermAgent AI
          </p>
        </div>

        {noAccountMsg && (
          <div
            style={{
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "10px", padding: "12px 16px",
              fontSize: "0.85rem", color: "#fbbf24",
              marginBottom: "20px", textAlign: "center",
            }}
          >
            No account found for this email. Create one below.
          </div>
        )}

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "10px", padding: "12px 16px",
              fontSize: "0.85rem", color: "#f87171",
              marginBottom: "20px", textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>
              Full Name
            </label>
            <input
              className="glass-input"
              type="text"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>
              Email
            </label>
            <input
              className="glass-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="glass-input"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={{ paddingRight: "48px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "14px", top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1, height: "3px", borderRadius: "2px",
                        background: i <= strength ? strengthColors[strength] : "rgba(255,255,255,0.08)",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: "0.75rem", color: strengthColors[strength] }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="glass-button"
            disabled={loading}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>

        <div
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            margin: "20px 0", color: "var(--text-muted)", fontSize: "0.8rem",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "var(--glass-border)" }} />
          <span>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--glass-border)" }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="glass-button-secondary"
          disabled={googleLoading}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "10px",
          }}
        >
          {googleLoading ? (
            <span className="spinner" />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent-teal)", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <RegisterForm />
    </Suspense>
  );
}
