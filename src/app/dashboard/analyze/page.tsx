"use client";

import { useState, useCallback } from "react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { Upload, Shield, ShieldOff, Crop, Sparkles, AlertTriangle, ChevronRight } from "lucide-react";
import Cropper from "react-easy-crop";
import { applyFaceDefender } from "@/lib/face-defender";
import imageCompression from "browser-image-compression";

interface AnalysisResult {
    skinType: string;
    skinScore: number;
    concerns: string[];
    summary: string;
    recommendations: string[];
}

export default function AnalyzePage() {
    const [image, setImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [faceDefenderEnabled, setFaceDefenderEnabled] = useState(true);
    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState("");

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setImage(dataUrl);
            setCroppedImage(null);
            setResult(null);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };

    const onCropComplete = useCallback((_: any, croppedPixels: any) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleCropDone = async () => {
        if (!image || !croppedAreaPixels) return;

        // Create cropped image from canvas
        const canvas = document.createElement("canvas");
        const img = new Image();
        img.src = image;

        await new Promise((resolve) => { img.onload = resolve; });

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(
            img,
            croppedAreaPixels.x, croppedAreaPixels.y,
            croppedAreaPixels.width, croppedAreaPixels.height,
            0, 0,
            croppedAreaPixels.width, croppedAreaPixels.height
        );

        let resultImage = canvas.toDataURL("image/jpeg", 0.9);

        if (faceDefenderEnabled) {
            try {
                resultImage = await applyFaceDefender(resultImage);
            } catch (err) {
                console.error("FaceDefender failed:", err);
            }
        }

        setCroppedImage(resultImage);
        setShowCropper(false);
    };

    const handleAnalyze = async () => {
        if (!croppedImage) return;
        setLoading(true);
        setError("");

        try {
            // Compress image to < 1MB
            let finalImage = croppedImage;
            try {
                const blob = await (await fetch(croppedImage)).blob();
                const compressedFile = await imageCompression(new File([blob], "image.jpg", { type: "image/jpeg" }), {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true
                });
                finalImage = await imageCompression.getDataUrlFromFile(compressedFile);
                console.log("Compressed image size (kB):", finalImage.length / 1024);
            } catch (compErr) {
                console.warn("Compression failed, sending original:", compErr);
            }

            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: finalImage }),
            });

            const text = await res.text();
            if (!text) throw new Error("Server returned an empty response. This usually means the image was too large or the server timed out.");

            let data;
            try {
                data = JSON.parse(text);
            } catch (parseErr) {
                console.error("Parse Error. Response was:", text.substring(0, 100));
                throw new Error("Server returned invalid data format");
            }

            if (!res.ok) throw new Error(data.error || "Analysis failed");

            setResult(data.analysis);
        } catch (err: any) {
            console.error("Frontend Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "#22c55e";
        if (score >= 60) return "#eab308";
        if (score >= 40) return "#f97316";
        return "#ef4444";
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Skin Analysis</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Upload a photo for AI-powered skin assessment</p>
            </div>

            {/* Upload Area */}
            {!image && (
                <GlassCard hover={false}>
                    <label
                        htmlFor="imageUpload"
                        style={{
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", padding: "60px 20px", cursor: "pointer",
                            border: "2px dashed var(--glass-border)", borderRadius: "12px",
                            transition: "all 0.3s",
                        }}
                    >
                        <Upload size={48} color="var(--accent-purple)" style={{ marginBottom: "16px" }} />
                        <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "6px" }}>Drop your skin photo here</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>or click to browse • JPG, PNG up to 10MB</p>
                        <input
                            id="imageUpload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                        />
                    </label>

                    <div className="disclaimer-banner" style={{ marginTop: "16px" }}>
                        <AlertTriangle size={12} style={{ display: "inline", marginRight: "6px" }} />
                        Your images are processed securely and never shared. FaceDefender™ anonymizes the eye region by default.
                    </div>
                </GlassCard>
            )}

            {/* Cropper */}
            {showCropper && image && (
                <GlassCard hover={false}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Crop size={18} color="var(--accent-purple)" />
                            <span style={{ fontWeight: 600 }}>Crop Your Image</span>
                        </div>
                        <button
                            onClick={() => setFaceDefenderEnabled(!faceDefenderEnabled)}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                background: faceDefenderEnabled ? "rgba(168, 85, 247, 0.2)" : "var(--glass-bg)",
                                border: `1px solid ${faceDefenderEnabled ? "var(--accent-purple)" : "var(--glass-border)"}`,
                                borderRadius: "10px", padding: "8px 16px", cursor: "pointer",
                                color: "var(--text-primary)", fontSize: "0.85rem", fontFamily: "Inter",
                            }}
                        >
                            {faceDefenderEnabled ? <Shield size={16} color="var(--accent-purple)" /> : <ShieldOff size={16} />}
                            FaceDefender™ {faceDefenderEnabled ? "ON" : "OFF"}
                        </button>
                    </div>

                    <div style={{ position: "relative", height: "400px", borderRadius: "12px", overflow: "hidden" }}>
                        <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                        <GlassButton variant="secondary" onClick={() => { setImage(null); setShowCropper(false); }}>
                            Cancel
                        </GlassButton>
                        <GlassButton onClick={handleCropDone}>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                Apply Crop <ChevronRight size={16} />
                            </span>
                        </GlassButton>
                    </div>
                </GlassCard>
            )}

            {/* Preview + Analyze */}
            {croppedImage && !result && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <GlassCard hover={false}>
                        <h3 style={{ fontWeight: 600, marginBottom: "12px" }}>Preview</h3>
                        <img
                            src={croppedImage}
                            alt="Cropped preview"
                            style={{ width: "100%", borderRadius: "12px", border: "1px solid var(--glass-border)" }}
                        />
                        {faceDefenderEnabled && (
                            <div style={{
                                display: "flex", alignItems: "center", gap: "6px", marginTop: "12px",
                                color: "var(--accent-purple)", fontSize: "0.8rem",
                            }}>
                                <Shield size={14} /> FaceDefender™ applied
                            </div>
                        )}
                    </GlassCard>

                    <GlassCard hover={false}>
                        <h3 style={{ fontWeight: 600, marginBottom: "12px" }}>Ready to Analyze</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "24px" }}>
                            Our AI will analyze your skin photo to detect your skin type, identify concerns, and provide personalized recommendations.
                        </p>
                        <GlassButton onClick={handleAnalyze} loading={loading} style={{ width: "100%" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                                <Sparkles size={18} /> Analyze My Skin
                            </span>
                        </GlassButton>
                        {error && (
                            <div style={{ marginTop: "12px", color: "#f87171", fontSize: "0.85rem" }}>{error}</div>
                        )}
                        <GlassButton variant="secondary" onClick={() => { setImage(null); setCroppedImage(null); }} style={{ width: "100%", marginTop: "12px" }}>
                            Upload Different Image
                        </GlassButton>
                    </GlassCard>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Score Card */}
                    <GlassCard hover={false}>
                        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                            <div style={{
                                width: "100px", height: "100px", borderRadius: "50%",
                                border: `4px solid ${getScoreColor(result.skinScore)}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexDirection: "column", flexShrink: 0,
                            }}>
                                <div style={{ fontSize: "2rem", fontWeight: 800, color: getScoreColor(result.skinScore) }}>
                                    {result.skinScore}
                                </div>
                                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>/ 100</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                                    Skin Type
                                </div>
                                <div style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px", textTransform: "capitalize" }}>
                                    {result.skinType}
                                </div>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                    {result.summary}
                                </p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Concerns + Recommendations */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <GlassCard hover={false}>
                            <h3 style={{ fontWeight: 600, marginBottom: "16px", fontSize: "1rem" }}>🔍 Concerns Detected</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {result.concerns.map((concern, i) => (
                                    <div key={i} style={{
                                        background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)",
                                        borderRadius: "8px", padding: "10px 14px", fontSize: "0.85rem", textTransform: "capitalize",
                                    }}>
                                        {concern}
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        <GlassCard hover={false}>
                            <h3 style={{ fontWeight: 600, marginBottom: "16px", fontSize: "1rem" }}>💡 Recommendations</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {result.recommendations.map((rec, i) => (
                                    <div key={i} style={{
                                        background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)",
                                        borderRadius: "8px", padding: "10px 14px", fontSize: "0.85rem",
                                    }}>
                                        {rec}
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    <GlassButton onClick={() => { setImage(null); setCroppedImage(null); setResult(null); }} style={{ alignSelf: "flex-start" }}>
                        Analyze Another Photo
                    </GlassButton>
                </div>
            )}
        </div>
    );
}
