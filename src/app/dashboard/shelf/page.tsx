"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import { Package, Plus, Trash2, AlertTriangle, Calendar, X } from "lucide-react";
import { format, differenceInDays, isPast, addMonths } from "date-fns";

interface ShelfProduct {
    id: string;
    name: string;
    brand: string;
    category: string;
    opened_date: string | null;
    expiry_date: string | null;
    pao_months: number | null;
    notes: string | null;
    created_at: string;
}

const CATEGORIES = ["Cleanser", "Serum", "Moisturizer", "Sunscreen", "Exfoliant", "Eye Cream", "Mask", "Toner", "Oil", "Other"];

export default function ShelfPage() {
    const [products, setProducts] = useState<ShelfProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        brand: "",
        category: "Moisturizer",
        opened_date: "",
        pao_months: "",
        notes: "",
    });
    const supabase = createClient();

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("shelf_products")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setProducts(data);
        }
        setLoading(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const openedDate = formData.opened_date || null;
        const paoMonths = formData.pao_months ? parseInt(formData.pao_months) : null;
        
        let expiryDate = null;
        if (openedDate && paoMonths) {
            expiryDate = addMonths(new Date(openedDate), paoMonths).toISOString();
        }

        const { error } = await supabase
            .from("shelf_products")
            .insert({
                user_id: user.id,
                name: formData.name,
                brand: formData.brand,
                category: formData.category,
                opened_date: openedDate,
                expiry_date: expiryDate,
                pao_months: paoMonths,
                notes: formData.notes || null,
            });

        if (!error) {
            setFormData({ name: "", brand: "", category: "Moisturizer", opened_date: "", pao_months: "", notes: "" });
            setShowForm(false);
            loadProducts();
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from("shelf_products")
            .delete()
            .eq("id", id);

        if (!error) {
            setProducts((prev) => prev.filter((p) => p.id !== id));
        }
    };

    const getExpiryStatus = (product: ShelfProduct) => {
        if (!product.expiry_date) return { status: "unknown", label: "No expiry set", color: "var(--text-muted)" };
        
        const daysUntilExpiry = differenceInDays(new Date(product.expiry_date), new Date());
        
        if (isPast(new Date(product.expiry_date))) {
            return { status: "expired", label: "Expired", color: "#ef4444" };
        } else if (daysUntilExpiry <= 30) {
            return { status: "expiring-soon", label: `Expires in ${daysUntilExpiry} days`, color: "#f59e0b" };
        } else if (daysUntilExpiry <= 90) {
            return { status: "good", label: `${daysUntilExpiry} days left`, color: "#eab308" };
        } else {
            return { status: "fresh", label: `${daysUntilExpiry} days left`, color: "#22c55e" };
        }
    };

    const expiredCount = products.filter(p => p.expiry_date && isPast(new Date(p.expiry_date))).length;
    const expiringSoonCount = products.filter(p => {
        if (!p.expiry_date) return false;
        const days = differenceInDays(new Date(p.expiry_date), new Date());
        return days > 0 && days <= 30;
    }).length;

    return (
        <div className="animate-fade-in" data-testid="shelf-page">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>My Product Shelf</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track your skincare products and their expiry dates</p>
                </div>
                <GlassButton onClick={() => setShowForm(!showForm)} data-testid="add-product-btn">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Plus size={16} /> Add Product
                    </span>
                </GlassButton>
            </div>

            {/* Expiry Alerts */}
            {(expiredCount > 0 || expiringSoonCount > 0) && (
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                    {expiredCount > 0 && (
                        <div style={{
                            background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "12px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "10px",
                        }} data-testid="expired-alert">
                            <AlertTriangle size={18} color="#ef4444" />
                            <span style={{ fontSize: "0.9rem" }}><strong>{expiredCount}</strong> product{expiredCount > 1 ? "s" : ""} expired</span>
                        </div>
                    )}
                    {expiringSoonCount > 0 && (
                        <div style={{
                            background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)",
                            borderRadius: "12px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "10px",
                        }} data-testid="expiring-soon-alert">
                            <Calendar size={18} color="#f59e0b" />
                            <span style={{ fontSize: "0.9rem" }}><strong>{expiringSoonCount}</strong> expiring within 30 days</span>
                        </div>
                    )}
                </div>
            )}

            {/* Add Product Form */}
            {showForm && (
                <GlassCard hover={false} className="animate-slide-up">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3 style={{ fontWeight: 600, fontSize: "1rem" }}>
                            <Package size={18} style={{ display: "inline", marginRight: "8px" }} />
                            Add New Product
                        </h3>
                        <button
                            onClick={() => setShowForm(false)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <GlassInput
                                id="name"
                                label="Product Name *"
                                placeholder="e.g. Hyaluronic Acid Serum"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                data-testid="product-name-input"
                            />
                            <GlassInput
                                id="brand"
                                label="Brand"
                                placeholder="e.g. The Ordinary"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                data-testid="product-brand-input"
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>
                                    Category
                                </label>
                                <select
                                    className="glass-input"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    style={{ cursor: "pointer" }}
                                    data-testid="product-category-select"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <GlassInput
                                id="opened_date"
                                label="Date Opened"
                                type="date"
                                value={formData.opened_date}
                                onChange={(e) => setFormData({ ...formData, opened_date: e.target.value })}
                                data-testid="product-opened-date-input"
                            />
                            <GlassInput
                                id="pao_months"
                                label="PAO (Months)"
                                type="number"
                                placeholder="e.g. 12"
                                value={formData.pao_months}
                                onChange={(e) => setFormData({ ...formData, pao_months: e.target.value })}
                                min="1"
                                max="60"
                                data-testid="product-pao-input"
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "6px" }}>
                                Notes (optional)
                            </label>
                            <textarea
                                className="glass-input"
                                placeholder="Any notes about this product..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={2}
                                style={{ resize: "vertical" }}
                                data-testid="product-notes-input"
                            />
                        </div>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <GlassButton variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</GlassButton>
                            <GlassButton type="submit" loading={saving} data-testid="save-product-btn">Save Product</GlassButton>
                        </div>
                    </form>
                    <div style={{ marginTop: "12px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        * PAO = Period After Opening. Check the jar symbol on your product packaging.
                    </div>
                </GlassCard>
            )}

            {/* Products Grid */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="loading-shimmer" style={{ height: "140px", borderRadius: "16px" }} />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <GlassCard hover={false}>
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <Package size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
                        <h3 style={{ fontWeight: 600, marginBottom: "8px" }}>Your shelf is empty</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            Add your skincare products to track their expiry dates and never use expired products again.
                        </p>
                    </div>
                </GlassCard>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                    {products.map((product) => {
                        const expiryStatus = getExpiryStatus(product);
                        return (
                            <GlassCard key={product.id} hover={false} data-testid={`shelf-product-${product.id}`}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                            <span style={{
                                                background: "rgba(168, 85, 247, 0.15)", color: "var(--accent-purple)",
                                                padding: "3px 10px", borderRadius: "6px", fontSize: "0.7rem",
                                                fontWeight: 600, textTransform: "uppercase",
                                            }}>
                                                {product.category}
                                            </span>
                                            <span style={{
                                                background: `${expiryStatus.color}22`,
                                                color: expiryStatus.color,
                                                padding: "3px 10px", borderRadius: "6px", fontSize: "0.7rem",
                                                fontWeight: 600,
                                            }}>
                                                {expiryStatus.label}
                                            </span>
                                        </div>
                                        <h3 style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "2px" }}>{product.name}</h3>
                                        {product.brand && (
                                            <p style={{ color: "var(--accent-purple)", fontSize: "0.8rem", fontWeight: 500, marginBottom: "8px" }}>
                                                {product.brand}
                                            </p>
                                        )}
                                        <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                            {product.opened_date && (
                                                <span>Opened: {format(new Date(product.opened_date), "MMM d, yyyy")}</span>
                                            )}
                                            {product.pao_months && (
                                                <span>PAO: {product.pao_months}M</span>
                                            )}
                                        </div>
                                        {product.notes && (
                                            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "8px", lineHeight: 1.4 }}>
                                                {product.notes}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        style={{
                                            background: "none", border: "none", cursor: "pointer",
                                            color: "var(--text-muted)", padding: "4px",
                                            transition: "color 0.2s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                                        title="Remove product"
                                        data-testid={`delete-product-${product.id}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
