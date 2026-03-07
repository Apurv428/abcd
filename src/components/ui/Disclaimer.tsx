"use client";

import { ShieldAlert } from "lucide-react";

export default function Disclaimer() {
    return (
        <div className="disclaimer-banner" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
            <ShieldAlert size={14} />
            <span>
                <strong>SkinExpert AI</strong> is a <strong>General Wellness Product</strong>. It does not provide medical diagnosis, treatment, or advice. Always consult a dermatologist for skin concerns.
            </span>
        </div>
    );
}
