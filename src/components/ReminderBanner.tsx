"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

export default function ReminderBanner() {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 10) {
            setMessage("☀️ Good morning! Time for your AM skincare routine.");
            setVisible(true);
        } else if (hour >= 18 && hour < 22) {
            setMessage("🌙 Good evening! Don't forget your PM skincare routine.");
            setVisible(true);
        } else if (hour >= 12 && hour < 14) {
            setMessage("🧴 Quick reminder: Reapply sunscreen if you're outdoors!");
            setVisible(true);
        }
    }, []);

    if (!visible) return null;

    return (
        <div
            style={{
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(236, 72, 153, 0.15))",
                border: "1px solid rgba(168, 85, 247, 0.25)",
                borderRadius: "12px",
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                animation: "slideUp 0.4s ease",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                <Bell size={16} color="var(--accent-purple)" />
                {message}
            </div>
            <button
                onClick={() => setVisible(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
                <X size={16} />
            </button>
        </div>
    );
}
