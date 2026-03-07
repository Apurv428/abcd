"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { User as SupaUser } from "@supabase/supabase-js";

export default function Header() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<SupaUser | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <header
            style={{
                padding: "16px 32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid var(--glass-border)",
                background: "rgba(10, 10, 26, 0.5)",
                backdropFilter: "blur(10px)",
            }}
        >
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""} ✨
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                    style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "var(--gradient-secondary)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                    }}
                    onClick={() => router.push("/dashboard/profile")}
                >
                    {user?.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="Avatar"
                            style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                        />
                    ) : (
                        <User size={18} color="white" />
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-secondary)", display: "flex", alignItems: "center",
                        gap: "6px", fontSize: "0.85rem", transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-pink)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </header>
    );
}
