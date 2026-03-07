"use client";

import React from "react";
import { clsx } from "clsx";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export default function GlassCard({ children, className, hover = true, onClick }: GlassCardProps) {
    return (
        <div
            className={clsx(hover ? "glass-card" : "glass-card-static", className)}
            onClick={onClick}
            style={{ padding: "24px" }}
        >
            {children}
        </div>
    );
}
