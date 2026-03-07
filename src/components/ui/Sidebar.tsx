"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ScanFace, Sun, ShoppingBag, BookOpen, User, Home, Package } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/analyze", label: "Skin Analysis", icon: ScanFace },
    { href: "/dashboard/routine", label: "My Routine", icon: Sun },
    { href: "/dashboard/products", label: "Products", icon: ShoppingBag },
    { href: "/dashboard/shelf", label: "My Shelf", icon: Package },
    { href: "/dashboard/journal", label: "Skin Journal", icon: BookOpen },
    { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside
            style={{
                width: "260px",
                minHeight: "100vh",
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid var(--glass-border)",
                background: "rgba(10, 10, 26, 0.8)",
                backdropFilter: "blur(20px)",
            }}
        >
            {/* Logo */}
            <Link href="/dashboard" style={{ textDecoration: "none", marginBottom: "40px", display: "flex", alignItems: "center", gap: "10px", padding: "0 8px" }}>
                <div style={{
                    width: "38px", height: "38px", borderRadius: "12px",
                    background: "var(--gradient-primary)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                }}>
                    <Sparkles size={20} color="white" />
                </div>
                <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        DermAgent
                    </div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 500, color: "var(--accent-purple)", letterSpacing: "2px", textTransform: "uppercase" }}>
                        AI
                    </div>
                </div>
            </Link>

            {/* Navigation */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "12px 16px",
                                borderRadius: "12px",
                                textDecoration: "none",
                                fontSize: "0.9rem",
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                background: isActive ? "rgba(168, 85, 247, 0.15)" : "transparent",
                                borderLeft: isActive ? "3px solid var(--accent-purple)" : "3px solid transparent",
                                transition: "all 0.2s ease",
                            }}
                        >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "0 8px" }}>
                © 2026 DermAgent AI
            </div>
        </aside>
    );
}
