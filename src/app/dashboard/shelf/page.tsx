"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Trash2, AlertTriangle, Info } from "lucide-react";
import { differenceInDays, format } from "date-fns";

interface ShelfProduct {
  id: string; name: string; brand: string | null; category: string | null;
  opened_date: string | null; expiry_date: string | null;
  pao_months: number | null; notes: string | null; created_at: string;
}

const CATEGORIES = ["Cleanser", "Toner", "Serum", "Moisturizer", "Sunscreen", "Exfoliant", "Eye Cream", "Mask", "Other"];

export default function ShelfPage() {
  const [products, setProducts] = useState<ShelfProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [openedDate, setOpenedDate] = useState("");
  const [paoMonths, setPaoMonths] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    try {
      const res = await fetch("/api/shelf");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/shelf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, brand, category, opened_date: openedDate, pao_months: paoMonths, notes }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setName(""); setBrand(""); setCategory(""); setOpenedDate(""); setPaoMonths(""); setNotes("");
      setShowForm(false);
      loadProducts();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this product from your shelf?")) return;
    try {
      await fetch(`/api/shelf?id=${id}`, { method: "DELETE" });
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) { console.error(err); }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return { label: "No expiry set", color: "var(--text-muted)", bg: "transparent" };
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return { label: "Expired", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
    if (days <= 30) return { label: `${days} days left ⚠️`, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    if (days <= 90) return { label: `${days} days left`, color: "#eab308", bg: "rgba(234,179,8,0.12)" };
    return { label: `${days} days left`, color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  };

  const expiredProducts = products.filter((p) => p.expiry_date && differenceInDays(new Date(p.expiry_date), new Date()) < 0);
  const expiringProducts = products.filter((p) => p.expiry_date && differenceInDays(new Date(p.expiry_date), new Date()) >= 0 && differenceInDays(new Date(p.expiry_date), new Date()) <= 30);

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>My Shelf</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track your skincare products and expiry dates</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="glass-button" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Alerts */}
      {expiredProducts.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "12px 18px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem" }}>
          <AlertTriangle size={16} color="#ef4444" />
          <span><strong>{expiredProducts.length}</strong> product{expiredProducts.length > 1 ? "s" : ""} expired! Consider replacing them.</span>
        </div>
      )}
      {expiringProducts.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", padding: "12px 18px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem" }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <span><strong>{expiringProducts.length}</strong> product{expiringProducts.length > 1 ? "s" : ""} expiring within 30 days.</span>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="glass-card-static animate-slide-up" style={{ padding: "24px", marginBottom: "20px" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "16px" }}>Add Product to Shelf</h3>
          <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Name *</label>
                <input className="glass-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="CeraVe Cleanser" required />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Brand</label>
                <input className="glass-input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="CeraVe" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Category</label>
                <select className="glass-input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ cursor: "pointer" }}>
                  <option value="">Select...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>
                  Date Opened
                </label>
                <input className="glass-input" type="date" value={openedDate} onChange={(e) => setOpenedDate(e.target.value)} style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
                  PAO (months) <span title="Period After Opening — check the jar symbol on packaging" style={{ cursor: "help" }}><Info size={12} color="var(--text-muted)" /></span>
                </label>
                <input className="glass-input" type="number" min="1" max="60" value={paoMonths} onChange={(e) => setPaoMonths(e.target.value)} placeholder="12" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>Notes</label>
              <textarea className="glass-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes about this product" style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button type="button" onClick={() => setShowForm(false)} className="glass-button-secondary">Cancel</button>
              <button type="submit" className="glass-button" disabled={saving}>{saving ? <span className="spinner" /> : "Add Product"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="loading-shimmer" style={{ height: "180px", borderRadius: "16px" }} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card-static" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Package size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
          <h3 style={{ fontWeight: 600, marginBottom: "8px" }}>Your shelf is empty</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>Add your skincare products to track their expiry dates.</p>
          <button onClick={() => setShowForm(true)} className="glass-button">Add Your First Product</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {products.map((product) => {
            const expiry = getExpiryStatus(product.expiry_date);
            return (
              <div key={product.id} className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  {product.category && (
                    <span style={{ background: "rgba(167, 139, 250, 0.12)", color: "var(--accent-lavender)", padding: "3px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 600 }}>
                      {product.category}
                    </span>
                  )}
                  <span style={{ background: expiry.bg, color: expiry.color, padding: "3px 10px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 600 }}>
                    {expiry.label}
                  </span>
                </div>
                <h3 style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "2px" }}>{product.name}</h3>
                {product.brand && <p style={{ color: "var(--accent-teal)", fontSize: "0.8rem" }}>{product.brand}</p>}
                <div style={{ display: "flex", gap: "16px", marginTop: "10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {product.opened_date && <span>Opened: {format(new Date(product.opened_date), "MMM d, yyyy")}</span>}
                  {product.pao_months && <span>PAO: {product.pao_months}M</span>}
                </div>
                {product.notes && <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "8px" }}>{product.notes}</p>}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                  <button onClick={() => handleDelete(product.id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", padding: "4px",
                    transition: "color 0.2s",
                  }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="disclaimer-banner" style={{ marginTop: "20px" }}>
        💡 PAO (Period After Opening) — Check the open jar symbol on your product packaging for the recommended use period.
      </div>
    </div>
  );
}
