"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import ReminderBanner from "@/components/ReminderBanner";
import {
  ScanFace, Sun, ShoppingBag, BookOpen, Package, User,
  Sparkles, TrendingUp, ArrowRight,
} from "lucide-react";

interface DashboardData {
  latestAnalysis: {
    skinScore: number | null;
    skinType: string | null;
    acneSeverity: string | null;
    hydrationLevel: string | null;
    fitzpatrickScale: number | null;
    urgentFlag: boolean;
    analysisJson: any;
  } | null;
  analysisCount: number;
  journalCount: number;
  shelfCount: number;
  firstName: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    latestAnalysis: null, analysisCount: 0, journalCount: 0, shelfCount: 0, firstName: "",
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [analyses, journal, shelf, profile] = await Promise.all([
        supabase.from("skin_analyses").select("skin_score, urgent_flag, analysis_json").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("shelf_products").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      ]);

      const { count: aCount } = await supabase.from("skin_analyses").select("id", { count: "exact", head: true }).eq("user_id", user.id);

      const firstName = (profile.data?.full_name || "").split(" ")[0] || "there";
      const latest = analyses.data?.[0];

      setData({
        latestAnalysis: latest ? {
          skinScore: latest.skin_score,
          skinType: latest.analysis_json?.skinType || null,
          acneSeverity: latest.analysis_json?.acne?.severity || null,
          hydrationLevel: latest.analysis_json?.hydration?.level || null,
          fitzpatrickScale: latest.analysis_json?.fitzpatrickScale || null,
          urgentFlag: latest.urgent_flag || false,
          analysisJson: latest.analysis_json,
        } : null,
        analysisCount: aCount ?? 0,
        journalCount: journal.count ?? 0,
        shelfCount: shelf.count ?? 0,
        firstName,
      });
      setLoading(false);
    }
    load();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const stats = [
    { label: "Overall Score", value: data.latestAnalysis?.skinScore != null ? `${data.latestAnalysis!.skinScore}/100` : "N/A", icon: Sparkles, gradient: "var(--gradient-brand)" },
    { label: "Acne Severity", value: data.latestAnalysis?.acneSeverity ? data.latestAnalysis!.acneSeverity!.replace(/_/g, " ") : "N/A", icon: TrendingUp, gradient: "var(--gradient-primary)" },
    { label: "Skin Type", value: data.latestAnalysis?.skinType ? data.latestAnalysis!.skinType!.charAt(0).toUpperCase() + data.latestAnalysis!.skinType!.slice(1) : "N/A", icon: BookOpen, gradient: "linear-gradient(135deg, #ec4899, #a78bfa)" },
    { label: "Hydration", value: data.latestAnalysis?.hydrationLevel ? data.latestAnalysis!.hydrationLevel!.replace(/_/g, " ") : "N/A", icon: Package, gradient: "var(--gradient-secondary)" },
  ];

  const miniStats = [
    { label: "Fitzpatrick", value: data.latestAnalysis?.fitzpatrickScale != null ? `Type ${data.latestAnalysis!.fitzpatrickScale}` : "N/A" },
    { label: "Total Analyses", value: data.analysisCount },
  ];

  const showUrgentBanner = data.latestAnalysis?.urgentFlag === true;

  const quickActions = [
    { href: "/dashboard/analyze", icon: ScanFace, label: "Analyze Skin", desc: "Upload a photo for AI analysis", gradient: "var(--gradient-brand)" },
    { href: "/dashboard/routine", icon: Sun, label: "My Routine", desc: "View your personalized routine", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)" },
    { href: "/dashboard/products", icon: ShoppingBag, label: "Products", desc: "See recommended products", gradient: "var(--gradient-primary)" },
    { href: "/dashboard/shelf", icon: Package, label: "My Shelf", desc: "Track product expiry dates", gradient: "var(--gradient-secondary)" },
    { href: "/dashboard/journal", icon: BookOpen, label: "Journal", desc: "Track your skin progress", gradient: "linear-gradient(135deg, #ec4899, #a78bfa)" },
    { href: "/dashboard/profile", icon: User, label: "Profile", desc: "Update your skin profile", gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)" },
  ];

  return (
    <div className="animate-fade-in">
      <ReminderBanner />

      {/* Urgent Flag Banner */}
      {showUrgentBanner && (
        <div style={{ 
          background: "rgba(239, 68, 68, 0.1)", 
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(239, 68, 68, 0.3)", 
          borderRadius: "12px", 
          padding: "14px 18px", 
          marginBottom: "20px",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.2rem" }}>⚠️</span>
            <span style={{ fontSize: "0.9rem" }}>
              Your last analysis flagged a concern requiring professional consultation.
            </span>
          </div>
          <Link href="/dashboard/analyze" style={{ color: "var(--accent-teal)", fontSize: "0.85rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            View Analysis →
          </Link>
        </div>
      )}

      {/* Greeting */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>
          {loading ? "Dashboard" : `${getGreeting()}, ${data.firstName} ✨`}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Your skincare journey at a glance
        </p>
      </div>

      {/* Mini Metrics Grid - 2x3 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card-static" style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: stat.gradient, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <stat.icon size={16} color="white" />
              </div>
              <div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 600, textTransform: "capitalize" }}>
                  {loading ? "—" : stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
        {miniStats.map((stat, i) => (
          <div key={`mini-${i}`} className="glass-card-static" style={{ padding: "16px" }}>
            <div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 600 }}>
                {loading ? "—" : stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "14px" }}>Quick Actions</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "46px", height: "46px", borderRadius: "13px",
                  background: action.gradient, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <action.icon size={22} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "2px" }}>{action.label}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{action.desc}</div>
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
