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
  skinScore: number | null;
  analysisCount: number;
  journalCount: number;
  shelfCount: number;
  firstName: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    skinScore: null, analysisCount: 0, journalCount: 0, shelfCount: 0, firstName: "",
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [analyses, journal, shelf, profile] = await Promise.all([
        supabase.from("skin_analyses").select("skin_score").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("shelf_products").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      ]);

      const { count: aCount } = await supabase.from("skin_analyses").select("id", { count: "exact", head: true }).eq("user_id", user.id);

      const firstName = (profile.data?.full_name || "").split(" ")[0] || "there";

      setData({
        skinScore: analyses.data?.[0]?.skin_score ?? null,
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
    { label: "Skin Score", value: data.skinScore !== null ? `${data.skinScore}/100` : "N/A", icon: Sparkles, gradient: "var(--gradient-brand)" },
    { label: "Analyses", value: data.analysisCount, icon: TrendingUp, gradient: "var(--gradient-primary)" },
    { label: "Journal Entries", value: data.journalCount, icon: BookOpen, gradient: "linear-gradient(135deg, #ec4899, #a78bfa)" },
    { label: "Shelf Products", value: data.shelfCount, icon: Package, gradient: "var(--gradient-secondary)" },
  ];

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

      {/* Greeting */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>
          {loading ? "Dashboard" : `${getGreeting()}, ${data.firstName} ✨`}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Your skincare journey at a glance
        </p>
      </div>

      {/* Stats Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "28px" }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card-static" style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "12px",
                background: stat.gradient, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <stat.icon size={20} color="white" />
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                  {loading ? "—" : stat.value}
                </div>
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
