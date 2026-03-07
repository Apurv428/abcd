"use client";

import React from "react";
import { clsx } from "clsx";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary";
    children: React.ReactNode;
    loading?: boolean;
}

export default function GlassButton({
    variant = "primary",
    children,
    className,
    loading,
    disabled,
    ...props
}: GlassButtonProps) {
    return (
        <button
            className={clsx(
                variant === "primary" ? "glass-button" : "glass-button-secondary",
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20" />
                    </svg>
                    Processing...
                </span>
            ) : (
                children
            )}
        </button>
    );
}
