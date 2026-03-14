"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { Upload, Shield, ShieldOff, Crop, Sparkles, AlertTriangle, ChevronRight, BookOpen, ShoppingBag, History } from "lucide-react";
import Cropper from "react-easy-crop";
import { applyFaceDefender } from "@/lib/face-defender";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface AnalysisResult {
  skinScore: number;
  skinType: string;
  fitzpatrickScale: number;
  fitzpatrickDescription: string;
  acne: {
    present: boolean;
    severity: string;
    severityScore: number;
    types: string[];
    primaryZones: string[];
  };
  pigmentation: {
    present: boolean;
    type: string;
    distribution: string;
    severity: string;
  };
  texture: {
    smoothnessScore: number;
    poreVisibility: string;
    issues: string[];
  };
  hydration: {
    level: string;
    score: number;
    signs: string[];
  };
  oiliness: {
    level: string;
    zones: string[];
  };
  redness: {
    present: boolean;
    type: string;
    severity: string;
  };
  aging: {
    visibleAgeMarkers: string[];
    perceivedSkinAge: number;
  };
  urgentFlag?: boolean;
  urgentReason?: string | null;
  concerns: string[];
  summary: string;
  recommendations: string[];
  imageQuality: string;
  imageQualityNote: string | null;
  category?: string;
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="loading-shimmer" style={{ height: "400px", borderRadius: "20px" }} />}>
      <AnalyzeContent />
    </Suspense>
  );
}

function AnalyzeContent() {
  const [image, setImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [faceDefenderEnabled, setFaceDefenderEnabled] = useState(true);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<"face" | "body" | "hair">("face");
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      loadPastAnalysis(id);
    }
  }, [searchParams]);

  const loadPastAnalysis = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("skin_analyses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setResult(data.analysis_json);
        setCroppedImage(data.image_url);
        if (data.analysis_json.category) {
          setCategory(data.analysis_json.category);
        }
      }
    } catch (err) {
      console.error("Failed to load past analysis:", err);
      setError("Failed to load analysis record.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      setCroppedImage(null);
      setResult(null);
      setShowCropper(true);
      setFaceDefenderEnabled(category === "face");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      setCroppedImage(null);
      setResult(null);
      setShowCropper(true);
      setFaceDefenderEnabled(category === "face");
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: unknown, croppedPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropDone = async () => {
    if (!image || !croppedAreaPixels) return;
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = image;
    await new Promise((resolve) => { img.onload = resolve; });
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height, 0, 0, croppedAreaPixels.width, croppedAreaPixels.height);
    let resultImage = canvas.toDataURL("image/jpeg", 0.9);
    if (faceDefenderEnabled) {
      try { resultImage = await applyFaceDefender(resultImage); } catch (err) { console.error("FaceDefender failed:", err); }
    }
    setCroppedImage(resultImage);
    setShowCropper(false);
  };
  
  const handleSkipCrop = async () => {
    if (!image) return;
    let resultImage = image;
    if (faceDefenderEnabled) {
      try { resultImage = await applyFaceDefender(resultImage); } catch (err) { console.error("FaceDefender failed:", err); }
    }
    setCroppedImage(resultImage);
    setShowCropper(false);
  };

  const handleAnalyze = async () => {
    if (!croppedImage) return;
    setLoading(true);
    setError("");
    try {
      let finalImage = croppedImage;
      try {
        const blob = await (await fetch(croppedImage)).blob();
        const compressedFile = await imageCompression(new File([blob], "image.jpg", { type: "image/jpeg" }), { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true });
        finalImage = await imageCompression.getDataUrlFromFile(compressedFile);
      } catch (compErr) { console.warn("Compression failed:", compErr); }

      const res = await fetch("/api/analyze", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ image: finalImage, category }) 
      });
      const text = await res.text();
      if (!text) throw new Error("Empty response from server.");
      let data;
      try { data = JSON.parse(text); } catch { throw new Error("Invalid response format"); }
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data.analysis);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally { setLoading(false); }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 65) return "#2dd4bf";
    if (score >= 50) return "#f59e0b";
    if (score >= 35) return "#f97316";
    return "#ef4444";
  };

  const resetFlow = () => { setImage(null); setCroppedImage(null); setResult(null); setError(""); };

  // SVG ring constants
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = result ? circumference - (result.skinScore / 100) * circumference : circumference;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Skin Analysis</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Upload a photo for AI-powered skin assessment</p>
      </div>

      {!image && !result && (
        <div style={{ marginBottom: "20px" }}>
          <Link href="/dashboard/history" className="glass-button-secondary" style={{ textDecoration: "none", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <History size={14} /> View Past Analyses
          </Link>
        </div>
      )}

      {/* Category Selection */}
      {!image && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          {[
            { id: "face", label: "Face", icon: "👤" },
            { id: "body", label: "Body Skin", icon: "💪" },
            { id: "hair", label: "Hair & Beard", icon: "🧔" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as any)}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: "16px",
                border: `1px solid ${category === cat.id ? "var(--accent-teal)" : "var(--glass-border)"}`,
                background: category === cat.id ? "rgba(45, 212, 191, 0.12)" : "var(--glass-bg)",
                cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column",
                alignItems: "center", gap: "8px", color: "var(--text-primary)",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{cat.icon}</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Upload */}
      {!image && (
        <div className="glass-card-static" style={{ padding: "24px" }}>
          <label
            htmlFor="imageUpload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "60px 20px", cursor: "pointer", border: "2px dashed var(--glass-border)",
              borderRadius: "12px", transition: "all 0.3s",
            }}
          >
            <Upload size={48} color="var(--accent-teal)" style={{ marginBottom: "16px" }} />
            <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "6px" }}>Drop your {category} photo here</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>or click to browse • JPG, PNG, WEBP up to 10MB</p>
            <input id="imageUpload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileSelect} style={{ display: "none" }} />
          </label>
          <div className="disclaimer-banner" style={{ marginTop: "16px" }}>
            <Shield size={12} style={{ display: "inline", marginRight: "6px" }} />
            {category === "face" ? "Your images are processed securely. FaceDefender™ anonymizes the eye region." : "Images are processed securely for area-specific analysis."}
          </div>
        </div>
      )}

      {/* Cropper */}
      {showCropper && image && (
        <div className="glass-card-static" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Crop size={18} color="var(--accent-teal)" />
              <span style={{ fontWeight: 600 }}>Crop Your Image</span>
            </div>
            {category === "face" && (
              <button
                onClick={() => setFaceDefenderEnabled(!faceDefenderEnabled)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  background: faceDefenderEnabled ? "rgba(45, 212, 191, 0.15)" : "var(--glass-bg)",
                  border: `1px solid ${faceDefenderEnabled ? "var(--accent-teal)" : "var(--glass-border)"}`,
                  borderRadius: "10px", padding: "8px 16px", cursor: "pointer",
                  color: "var(--text-primary)", fontSize: "0.85rem", fontFamily: "var(--font-body)",
                }}
              >
                {faceDefenderEnabled ? <Shield size={16} color="var(--accent-teal)" /> : <ShieldOff size={16} />}
                FaceDefender™ {faceDefenderEnabled ? "ON" : "OFF"}
              </button>
            )}
          </div>
          <div style={{ position: "relative", height: "400px", borderRadius: "12px", overflow: "hidden" }}>
            <Cropper image={image} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div style={{ marginTop: "12px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Zoom</label>
            <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "var(--accent-teal)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <button className="glass-button-secondary" onClick={() => { setImage(null); setShowCropper(false); }}>Cancel</button>
            <div style={{ display: "flex", gap: "12px" }}>
              <button className="glass-button-secondary" onClick={handleSkipCrop}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>Use Full Image</span>
              </button>
              <button className="glass-button" onClick={handleCropDone}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>Apply Crop <ChevronRight size={16} /></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview + Analyze */}
      {croppedImage && !result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="glass-card-static" style={{ padding: "24px" }}>
            <h3 style={{ fontWeight: 600, marginBottom: "12px" }}>Preview</h3>
            <img src={croppedImage} alt="Cropped preview" style={{ width: "100%", borderRadius: "12px", border: "1px solid var(--glass-border)" }} />
            {faceDefenderEnabled && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", color: "var(--accent-teal)", fontSize: "0.8rem" }}>
                <Shield size={14} /> FaceDefender™ applied
              </div>
            )}
          </div>
          <div className="glass-card-static" style={{ padding: "24px" }}>
            <h3 style={{ fontWeight: 600, marginBottom: "12px" }}>Ready to Analyze</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "24px" }}>
              Our AI will analyze your skin to detect skin type, identify concerns, and provide personalized recommendations.
            </p>
            <button className="glass-button" onClick={handleAnalyze} disabled={loading} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              {loading ? (
                <><div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Analyzing...</>
              ) : (
                <><Sparkles size={18} /> Analyze My Skin</>
              )}
            </button>
            {error && <div style={{ marginTop: "12px", color: "#f87171", fontSize: "0.85rem" }}>{error}</div>}
            <button className="glass-button-secondary" onClick={resetFlow} style={{ width: "100%", marginTop: "12px" }}>Upload Different Image</button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: "80px", height: "80px", margin: "0 auto 20px", border: "3px solid var(--glass-border)", borderTopColor: "var(--accent-teal)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Analyzing your skin...</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>This may take a few seconds</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="animate-slide-up" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* SECTION A: Header Score Band */}
          <div className="glass-card-static" style={{ padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
              <svg width="110" height="110" viewBox="0 0 110 110" style={{ flexShrink: 0 }}>
                <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="55" cy="55" r={radius} fill="none"
                  stroke={getScoreColor(result.skinScore)} strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={circumference}
                  strokeDashoffset={scoreOffset}
                  className="score-ring-animated"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                />
                <text x="55" y="50" textAnchor="middle" fill={getScoreColor(result.skinScore)} fontSize="24" fontWeight="800">{result.skinScore}</text>
                <text x="55" y="68" textAnchor="middle" fill="var(--text-muted)" fontSize="11">/ 100</text>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                  Overall Skin Score
                </div>
                <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.6 }}>{result.summary}</p>
              </div>
            </div>
          </div>

          {/* SECTION B: Urgent Flag Banner */}
          {result.urgentFlag && (
            <div style={{ 
              background: "rgba(239, 68, 68, 0.1)", 
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(239, 68, 68, 0.3)", 
              borderRadius: "12px", 
              padding: "16px 20px", 
              display: "flex", 
              alignItems: "flex-start", 
              gap: "12px" 
            }}>
              <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f87171", marginBottom: "4px" }}>
                  Professional Consultation Recommended
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                  {result.urgentReason}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  This does not constitute medical advice. Please see a licensed dermatologist.
                </div>
              </div>
            </div>
          )}

          {/* SECTION C: Skin Profile Strip */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div className="glass-card-static" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Skin</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-teal)", textTransform: "capitalize" }}>{result.skinType}</span>
            </div>
            <div className="glass-card-static" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Fitzpatrick</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-lavender)" }}>
                Type {result.fitzpatrickScale} — {result.fitzpatrickDescription?.substring(0, 12) || ""}
              </span>
            </div>
            <div className="glass-card-static" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Hydration</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#60a5fa" }}>{result.hydration?.level?.replace(/_/g, " ") || "N/A"}</span>
            </div>
            <div className="glass-card-static" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Est. Age</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f472b6" }}>{result.aging?.perceivedSkinAge || "—"} yrs</span>
            </div>
          </div>

          {/* SECTION D: Detailed Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            
            {/* Card 1: Acne Analysis */}
            <div className="glass-card-static" style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Acne Analysis</h4>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "6px" }}>IGA Severity Scale</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[0,1,2,3,4].map(i => (
                    <div key={i} style={{ 
                      width: "20px", height: "20px", borderRadius: "50%", 
                      background: i <= (result.acne?.severityScore || 0) ? "var(--accent-teal)" : "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }} />
                  ))}
                </div>
              </div>
              {result.acne?.present && (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {result.acne?.types?.map((t: string, i: number) => (
                      <span key={i} style={{ fontSize: "0.7rem", padding: "3px 8px", background: "rgba(45,212,191,0.1)", borderRadius: "6px", color: "var(--accent-teal)" }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {result.acne?.primaryZones?.map((z: string, i: number) => (
                      <span key={i} style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", border: "0.6px solid var(--glass-border)" }}>{z}</span>
                    ))}
                  </div>
                </>
              )}
              {!result.acne?.present && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No significant acne detected</div>}
            </div>

            {/* Card 2: Pigmentation */}
            <div className="glass-card-static" style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Pigmentation</h4>
              {result.pigmentation?.present ? (
                <>
                  <div style={{ display: "inline-block", background: "rgba(167, 139, 250, 0.15)", padding: "4px 12px", borderRadius: "8px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-lavender)" }}>
                      {result.pigmentation?.type === "PIH" ? "PIH — Post-Inflammatory Hyperpigmentation" :
                       result.pigmentation?.type === "PIE" ? "PIE — Post-Inflammatory Erythema" :
                       result.pigmentation?.type === "melasma" ? "Melasma" :
                       result.pigmentation?.type === "sun_spots" ? "Sun Spots / Solar Lentigines" :
                       result.pigmentation?.type === "freckles" ? "Ephelides (Freckles)" :
                       result.pigmentation?.type === "mixed" ? "Mixed Hyperpigmentation" :
                       result.pigmentation?.type || "Unknown"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {result.pigmentation?.distribution} • {result.pigmentation?.severity}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No Significant Pigmentation</div>
              )}
            </div>

            {/* Card 3: Skin Texture */}
            <div className="glass-card-static" style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Skin Texture</h4>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Smoothness</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent-teal)" }}>{result.texture?.smoothnessScore || 0}/100</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${result.texture?.smoothnessScore || 0}%`, height: "100%", background: "var(--accent-teal)", borderRadius: "2px", transition: "width 0.5s ease" }} />
                </div>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: "6px" }}>Pores:</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>{result.texture?.poreVisibility?.replace(/_/g, " ") || "N/A"}</span>
              </div>
              {result.texture?.issues?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {result.texture?.issues?.map((issue: string, i: number) => (
                    <span key={i} style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", border: "0.6px solid var(--glass-border)" }}>{issue.replace(/_/g, " ")}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Card 4: Hydration & Oiliness */}
            <div className="glass-card-static" style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Hydration & Oiliness</h4>
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Hydration</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#60a5fa" }}>{result.hydration?.score || 0}/100</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${result.hydration?.score || 0}%`, height: "100%", background: "#60a5fa", borderRadius: "2px", transition: "width 0.5s ease" }} />
                </div>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: "6px" }}>Oiliness:</span>
                <span style={{ 
                  fontSize: "0.8rem", fontWeight: 600, 
                  color: (result.oiliness?.level === "none" || result.oiliness?.level === "low") ? "#22c55e" : 
                         result.oiliness?.level === "moderate" ? "#eab308" : "#ef4444" 
                }}>{result.oiliness?.level?.replace(/_/g, " ") || "N/A"}</span>
              </div>
              {result.oiliness?.zones?.length > 0 && result.oiliness?.zones?.[0] !== "none" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {result.oiliness?.zones?.map((z: string, i: number) => (
                    <span key={i} style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", border: "0.6px solid var(--glass-border)" }}>{z}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Card 5: Redness & Inflammation */}
            <div className="glass-card-static" style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Redness & Inflammation</h4>
              {result.redness?.present ? (
                <>
                  <div style={{ display: "inline-block", background: "rgba(248, 113, 113, 0.15)", padding: "4px 12px", borderRadius: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#f87171" }}>
                      {result.redness?.type === "rosacea_suspect" ? "Rosacea Suspect" :
                       result.redness?.type === "general_inflammation" ? "General Inflammation" :
                       result.redness?.type === "post_acne" ? "Post-Acne" :
                       result.redness?.type === "irritation" ? "Irritation" : "Redness"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{result.redness?.severity}</div>
                </>
              ) : (
                <div style={{ fontSize: "0.8rem", color: "#22c55e" }}>No significant redness detected</div>
              )}
            </div>

            {/* Card 6: Skin Aging */}
            <div className="glass-card-static" style={{ padding: "20px" }}>
              <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Skin Aging</h4>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: "6px" }}>Estimated:</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f472b6" }}>{result.aging?.perceivedSkinAge || "—"} years</span>
              </div>
              {result.aging?.visibleAgeMarkers?.length > 0 && result.aging?.visibleAgeMarkers?.[0] !== "none" ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {result.aging?.visibleAgeMarkers?.map((m: string, i: number) => (
                    <span key={i} style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(244, 114, 182, 0.15)", borderRadius: "4px", color: "#f472b6" }}>{m.replace(/_/g, " ")}</span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No significant aging markers detected</div>
              )}
            </div>
          </div>

          {/* SECTION E: Concerns List */}
          <div className="glass-card-static" style={{ padding: "24px" }}>
            <h3 style={{ fontWeight: 600, marginBottom: "16px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              🔬 Clinical Findings
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {result.concerns?.map((concern: string, i: number) => (
                <div key={i} style={{ 
                  background: "rgba(239, 68, 68, 0.08)", 
                  border: "1px solid rgba(239, 68, 68, 0.15)", 
                  borderRadius: "10px", 
                  padding: "12px 16px", 
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <AlertTriangle size={16} color="#ef4444" />
                  {concern}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION F: Recommendations List */}
          <div className="glass-card-static" style={{ padding: "24px" }}>
            <h3 style={{ fontWeight: 600, marginBottom: "16px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              🍃 Treatment Recommendations
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {result.recommendations?.map((rec: string, i: number) => (
                <div key={i} style={{ 
                  background: "rgba(34, 197, 94, 0.08)", 
                  border: "1px solid rgba(34, 197, 94, 0.15)", 
                  borderRadius: "10px", 
                  padding: "12px 16px", 
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <div style={{ 
                    width: "20px", height: "20px", borderRadius: "50%", 
                    background: "rgba(34, 197, 94, 0.2)", 
                    display: "flex", alignItems: "center", justifyContent: "center" 
                  }}>
                    <span style={{ fontSize: "0.7rem", color: "#22c55e" }}>✓</span>
                  </div>
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION G: Image Quality Note */}
          {result.imageQuality !== "good" && result.imageQualityNote && (
            <div style={{ 
              background: "rgba(234, 179, 8, 0.1)", 
              border: "1px solid rgba(234, 179, 8, 0.2)", 
              borderRadius: "12px", 
              padding: "14px 18px", 
              display: "flex", 
              alignItems: "center", 
              gap: "10px" 
            }}>
              <span style={{ fontSize: "1.1rem" }}>📷</span>
              <span style={{ fontSize: "0.85rem", color: "#fbbf24" }}>{result.imageQualityNote}</span>
            </div>
          )}

          {/* SECTION H: Action Buttons Row */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/dashboard/products" className="glass-button" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShoppingBag size={16} /> View Matched Products
            </Link>
            <Link href="/dashboard/routine" className="glass-button-secondary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
              Generate Routine
            </Link>
            <Link href={`/dashboard/journal?score=${result.skinScore}`} className="glass-button-secondary" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={16} /> Save to Journal
            </Link>
            <button className="glass-button-secondary" onClick={resetFlow} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} /> Analyze Another Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
