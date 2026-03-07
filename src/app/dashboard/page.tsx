"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import ReminderBanner from "@/components/ReminderBanner";
import { ScanFace, Sun, ShoppingBag, BookOpen, TrendingUp, Sparkles } from "lucide-react";

interface DashboardData {
    skinScore: number | null;
    analysisCount: number;
    journalCount: number;
    lastRoutineDate: string | null;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData>({
        skinScore: null, analysisCount: 0, journalCount: 0, lastRoutineDate: null
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [analyses, journal, routines] = await Promise.all([
                supabase.from("skin_analyses").select("skin_score, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
                supabase.from("journal_entries").select("id").eq("user_id", user.id),
                supabase.from("routines").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
            ]);

            const { count: aCount } = await supabase.from("skin_analyses").select("id", { count: "exact", head: true }).eq("user_id", user.id);

            setData({
                skinScore: analyses.data?.[0]?.skin_score ?? null,
                analysisCount: aCount ?? 0,
                journalCount: journal.data?.length ?? 0,
                lastRoutineDate: routines.data?.[0]?.created_at ?? null,
            });
            setLoading(false);
        }
        load();
    }, []);

    const quickActions = [
        { href: "/dashboard/analyze", icon: ScanFace, label: "Analyze Skin", desc: "Upload a photo for AI analysis", gradient: "linear-gradient(135deg, #a855f7, #7c3aed)" },
        { href: "/dashboard/routine", icon: Sun, label: "My Routine", desc: "View your personalized routine", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)" },
        { href: "/dashboard/products", icon: ShoppingBag, label: "Products", desc: "See recommended products", gradient: "linear-gradient(135deg, #3b82f6, #14b8a6)" },
        { href: "/dashboard/journal", icon: BookOpen, label: "Skin Journal", desc: "Track your progress", gradient: "linear-gradient(135deg, #ec4899, #f43f5e)" },
    ];

    return (
        <div className="animate-fade-in">
            <ReminderBanner />

            <div style={{ marginBottom: "32px" }}>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Dashboard</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Your skincare journey at a glance</p>
            </div>

            {/* Stats Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
                <GlassCard hover={false}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Sparkles size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Skin Score</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                                {loading ? "—" : data.skinScore !== null ? `${data.skinScore}/100` : "N/A"}
                            </div>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard hover={false}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--gradient-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <TrendingUp size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Analyses</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{loading ? "—" : data.analysisCount}</div>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard hover={false}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #ec4899, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <BookOpen size={22} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>Journal Entries</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{loading ? "—" : data.journalCount}</div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Quick Actions */}
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px" }}>Quick Actions</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                {quickActions.map((action) => (
                    <Link key={action.href} href={action.href} style={{ textDecoration: "none", color: "inherit" }}>
                        <GlassCard>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{
                                    width: "50px", height: "50px", borderRadius: "14px",
                                    background: action.gradient, display: "flex",
                                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    <action.icon size={24} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "2px" }}>{action.label}</div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{action.desc}</div>
                                </div>
                            </div>
                        </GlassCard>
                    </Link>
                ))}
            </div>
        </div>
    );
}
