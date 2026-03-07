"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import GlassCard from "@/components/ui/GlassCard";
import { getProductRecommendations, type Product } from "@/lib/products";
import { ExternalLink, Star, ShoppingBag } from "lucide-react";

export default function ProductsPage() {
    const [products, setProducts] = useState<(Product & { matchScore: number })[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get latest analysis
            const { data: analysis } = await supabase
                .from("skin_analyses")
                .select("analysis_json")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            // Get profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("skin_type, concerns")
                .eq("id", user.id)
                .single();

            const skinType = analysis?.analysis_json?.skinType || profile?.skin_type || "combination";
            const concerns = analysis?.analysis_json?.concerns || profile?.concerns || ["general care"];

            const recs = getProductRecommendations(skinType, concerns, 8);
            setProducts(recs);
            setLoading(false);
        }
        load();
    }, []);

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            Cleanser: "#3b82f6",
            Serum: "#a855f7",
            Moisturizer: "#14b8a6",
            Sunscreen: "#f59e0b",
            Exfoliant: "#ec4899",
            "Eye Cream": "#6366f1",
        };
        return colors[category] || "#64748b";
    };

    if (loading) {
        return (
            <div className="animate-fade-in">
                <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "24px" }}>Recommended Products</h1>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="loading-shimmer" style={{ height: "180px", borderRadius: "16px" }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Recommended Products</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Curated picks based on your skin analysis</p>
            </div>

            {products.length === 0 ? (
                <GlassCard hover={false}>
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <ShoppingBag size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
                        <h3 style={{ fontWeight: 600, marginBottom: "8px" }}>No recommendations yet</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            Complete a skin analysis first to get personalized product recommendations.
                        </p>
                    </div>
                </GlassCard>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                    {products.map((product) => (
                        <GlassCard key={product.id}>
                            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                    <span style={{
                                        background: `${getCategoryColor(product.category)}22`,
                                        color: getCategoryColor(product.category),
                                        border: `1px solid ${getCategoryColor(product.category)}44`,
                                        padding: "3px 10px", borderRadius: "6px", fontSize: "0.7rem",
                                        fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px",
                                    }}>
                                        {product.category}
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                                        <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{product.matchScore}%</span>
                                    </div>
                                </div>

                                <h3 style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "2px" }}>{product.name}</h3>
                                <p style={{ color: "var(--accent-purple)", fontSize: "0.8rem", fontWeight: 500, marginBottom: "8px" }}>
                                    {product.brand}
                                </p>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.5, flex: 1, marginBottom: "16px" }}>
                                    {product.description}
                                </p>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{product.price}</span>
                                    <a
                                        href={product.affiliateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="glass-button"
                                        style={{
                                            padding: "8px 16px", fontSize: "0.8rem",
                                            display: "flex", alignItems: "center", gap: "6px",
                                            textDecoration: "none",
                                        }}
                                    >
                                        Buy <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            <div className="disclaimer-banner" style={{ marginTop: "24px" }}>
                Links may contain affiliate references. Product availability and prices may vary. SkinExpert AI is not affiliated with any brand.
            </div>
        </div>
    );
}
