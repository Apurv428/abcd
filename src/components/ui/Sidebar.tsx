"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Sparkles, ScanFace, Sun, ShoppingBag, BookOpen, User, Home, Package, LogOut, Menu, X, History,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/analyze", label: "Skin Analysis", icon: ScanFace },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/routine", label: "My Routine", icon: Sun },
  { href: "/dashboard/products", label: "Products", icon: ShoppingBag },
  { href: "/dashboard/shelf", label: "My Shelf", icon: Package },
  { href: "/dashboard/journal", label: "Journal", icon: BookOpen },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email || "");
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setUserName(profile?.full_name || "");
    }
    load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  const navContent = (
    <>
      <Link href="/dashboard" style={{ textDecoration: "none", marginBottom: "36px", display: "flex", alignItems: "center", gap: "10px", padding: "0 8px" }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "12px",
          background: "var(--gradient-brand)", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={20} color="white" />
        </div>
        <div>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>DermAgent</div>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--accent-teal)", letterSpacing: "2px", textTransform: "uppercase" }}>AI</div>
        </div>
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href} href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 16px", borderRadius: "12px", textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--accent-teal)" : "var(--text-secondary)",
                background: isActive ? "rgba(45, 212, 191, 0.1)" : "transparent",
                borderLeft: isActive ? "3px solid var(--accent-teal)" : "3px solid transparent",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "16px", marginTop: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px", marginBottom: "12px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "var(--gradient-brand)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "white", flexShrink: 0,
          }}>
            {getInitials(userName)}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName || "User"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userEmail}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            width: "100%", padding: "10px 16px", borderRadius: "10px",
            background: "none", border: "1px solid var(--glass-border)",
            color: "var(--text-secondary)", fontSize: "0.8rem", cursor: "pointer",
            fontFamily: "var(--font-body)", transition: "all 0.2s",
          }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hide-mobile"
        style={{
          width: "240px", minHeight: "100vh", padding: "24px 14px",
          display: "flex", flexDirection: "column",
          borderRight: "1px solid var(--glass-border)",
          background: "rgba(6, 6, 18, 0.9)", backdropFilter: "blur(20px)",
          position: "fixed", left: 0, top: 0, zIndex: 40,
        }}
      >
        {navContent}
      </aside>

      {/* Mobile Header */}
      <div
        className="show-mobile"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          height: "60px", padding: "0 16px",
          background: "rgba(6, 6, 18, 0.95)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "10px",
            background: "var(--gradient-brand)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>DermAgent AI</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", padding: "4px" }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay Nav */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed", top: "60px", left: 0, right: 0, bottom: 0, zIndex: 45,
            background: "rgba(6, 6, 18, 0.98)", backdropFilter: "blur(20px)",
            padding: "24px 16px",
            display: "flex", flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {navContent}
        </div>
      )}
    </>
  );
}
