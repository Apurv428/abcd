"use client";

import React from "react";
import { clsx } from "clsx";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export default function GlassInput({ label, className, id, ...props }: GlassInputProps) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {label && (
                <label
                    htmlFor={id}
                    style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}
                >
                    {label}
                </label>
            )}
            <input id={id} className={clsx("glass-input", className)} {...props} />
        </div>
    );
}
