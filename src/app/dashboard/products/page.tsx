"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { getProductRecommendations, type Product } from "@/lib/products";
import { ExternalLink, Star, ShoppingBag } from "lucide-react";

const CATEGORIES = ["All", "Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen", "Exfoliant", "Eye Cream", "Mask"];

export default function ProductsPage() {
  const [products, setProducts] = useState<(Product & { matchScore: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [userSkinType, setUserSkinType] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: analysis } = await supabase
        .from("skin_analyses").select("analysis_json")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single();

      const { data: profile } = await supabase
        .from("profiles").select("skin_type, concerns")
        .eq("id", user.id).single();

      const skinType = analysis?.analysis_json?.skinType || profile?.skin_type || "combination";
      const concerns = analysis?.analysis_json?.concerns || profile?.concerns || ["general care"];
      setUserSkinType(skinType);

      const recs = getProductRecommendations(skinType, concerns, 20);
      setProducts(recs);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);

  const getBadgeColor = (badge: string) => {
    const colors: Record<string, string> = {
      "Best Seller": "#f59e0b",
      "Editor's Pick": "#a78bfa",
      "Cult Classic": "#ec4899",
      "Dermatologist Recommended": "#2dd4bf",
      "Fan Favourite": "#6366f1",
    };
    return colors[badge] || "#64748b";
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={13} fill={i < full || (i === full && half) ? "#f59e0b" : "transparent"} color={i < full || (i === full && half) ? "#f59e0b" : "var(--text-muted)"} />
        ))}
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: "4px" }}>{rating}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "24px" }}>Recommended Products</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="loading-shimmer" style={{ height: "200px", borderRadius: "16px" }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Recommended Products</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Matched for <span style={{ color: "var(--accent-teal)", fontWeight: 600, textTransform: "capitalize" }}>{userSkinType}</span> skin
        </p>
      </div>

      {/* Category Filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: "7px 16px", borderRadius: "10px", cursor: "pointer",
            border: `1px solid ${activeCategory === cat ? "var(--accent-teal)" : "var(--glass-border)"}`,
            background: activeCategory === cat ? "rgba(45, 212, 191, 0.12)" : "var(--glass-bg)",
            color: activeCategory === cat ? "var(--accent-teal)" : "var(--text-secondary)",
            fontSize: "0.8rem", fontWeight: activeCategory === cat ? 600 : 400,
            fontFamily: "var(--font-body)", transition: "all 0.2s",
          }}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card-static" style={{ padding: "40px", textAlign: "center" }}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
          <h3 style={{ fontWeight: 600, marginBottom: "8px" }}>No products in this category</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Try selecting a different category or complete a skin analysis first.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {filtered.map((product) => (
            <div key={product.id} className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
              {/* Badge + Category */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <span style={{
                  background: "rgba(167, 139, 250, 0.12)", color: "var(--accent-lavender)",
                  padding: "3px 10px", borderRadius: "6px", fontSize: "0.7rem",
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  {product.category}
                </span>
                {product.badge && (
                  <span style={{
                    background: `${getBadgeColor(product.badge)}18`, color: getBadgeColor(product.badge),
                    padding: "3px 10px", borderRadius: "6px", fontSize: "0.65rem", fontWeight: 600,
                  }}>
                    {product.badge}
                  </span>
                )}
              </div>

              <h3 style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "2px" }}>{product.name}</h3>
              <p style={{ color: "var(--accent-teal)", fontSize: "0.8rem", fontWeight: 500, marginBottom: "6px" }}>{product.brand}</p>
              {renderStars(product.rating)}
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.5, flex: 1, margin: "10px 0" }}>{product.description}</p>

              {/* Match Score Bar */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Match Score</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--accent-teal)" }}>{product.matchScore}%</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${product.matchScore}%`, background: "var(--gradient-brand)", borderRadius: "2px", transition: "width 0.5s" }} />
                </div>
              </div>

              {/* Price + Buy Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 700, fontSize: "1.05rem" }}>${product.price.toFixed(2)}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {product.affiliateUrls.amazon && (
                    <a href={product.affiliateUrls.amazon} target="_blank" rel="noopener noreferrer" className="glass-button" style={{ padding: "6px 12px", fontSize: "0.75rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                      Amazon <ExternalLink size={11} />
                    </a>
                  )}
                  {product.affiliateUrls.sephora && (
                    <a href={product.affiliateUrls.sephora} target="_blank" rel="noopener noreferrer" className="glass-button-secondary" style={{ padding: "6px 12px", fontSize: "0.75rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", borderColor: "var(--accent-lavender)", color: "var(--accent-lavender)" }}>
                      Sephora <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="disclaimer-banner" style={{ marginTop: "24px" }}>
        Links may contain affiliate references. Product availability and prices may vary.
      </div>
    </div>
  );
}
