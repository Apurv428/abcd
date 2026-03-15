"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, Trash2, ChevronRight, Sparkles, BookOpen, ShoppingBag, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getAnalysisImageUrl, deleteAnalysisImage } from "@/lib/analysis-images";
import Link from "next/link";

interface AnalysisRecord {
  id: string;
  created_at: string;
  image_url: string | null;
  skin_score: number;
  urgent_flag: boolean;
  analysis_json: {
    skinType: string;
    summary: string;
    concerns: string[];
    recommendations: string[];
    category?: string;
    acne?: { present?: boolean; severity?: string; severityScore?: number; types?: string[]; primaryZones?: string[] };
    pigmentation?: { present?: boolean; type?: string; distribution?: string; severity?: string };
    texture?: { smoothnessScore?: number; poreVisibility?: string; issues?: string[] };
    hydration?: { level?: string; score?: number; signs?: string[] };
    oiliness?: { level?: string; zones?: string[] };
    redness?: { present?: boolean; type?: string; severity?: string };
    aging?: { visibleAgeMarkers?: string[]; perceivedSkinAge?: number };
    fitzpatrickScale?: number;
    fitzpatrickDescription?: string;
    urgentFlag?: boolean;
    urgentReason?: string | null;
  };
}

export default function AnalysisDetailClient({ analysis }: { analysis: AnalysisRecord }) {
  const router = useRouter();
  const supabase = createClient();
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const result = analysis.analysis_json;

  useEffect(() => {
    if (analysis.image_url) {
      getAnalysisImageUrl(analysis.image_url).then(url => {
        setSignedImageUrl(url);
      });
    }
  }, [analysis.image_url]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 65) return "#2dd4bf";
    if (score >= 50) return "#f59e0b";
    if (score >= 35) return "#f97316";
    return "#ef4444";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 65) return "Good";
    if (score >= 50) return "Fair";
    if (score >= 35) return "Needs Work";
    return "Poor";
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this analysis? This cannot be undone.")) return;
    
    setDeleting(true);
    try {
      if (analysis.image_url) {
        await deleteAnalysisImage(analysis.image_url);
      }
      await supabase.from('skin_analyses').delete().eq('id', analysis.id);
      router.push('/dashboard/history');
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
    }
  };

  const analysisType = result?.category || 'face';
  const typeConfig: Record<string, { label: string; emoji: string; color: string; border: string }> = {
    face: { label: 'Face', emoji: '👤', color: 'rgba(45,212,191,0.15)', border: 'rgba(45,212,191,0.3)' },
    body: { label: 'Body Skin', emoji: '💪', color: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)' },
    hair: { label: 'Hair & Beard', emoji: '🧔', color: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)' },
  };
  const type = typeConfig[analysisType] || typeConfig.face;

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (analysis.skin_score / 100) * circumference;

  return (
    <div className="animate-fade-in" style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Back Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/dashboard/history" style={{
          fontSize: '13px', color: '#8892a4', 
          textDecoration: 'none', display: 'flex',
          alignItems: 'center', gap: '6px'
        }}>
          ← Back to History
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px', padding: '4px 10px',
              background: type.color, border: `1px solid ${type.border}`,
              borderRadius: '12px', color: '#f0f4ff'
            }}>
              {type.emoji} {type.label}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {format(new Date(analysis.created_at), 'MMMM d, yyyy · h:mm a')}
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Analysis Details</h1>
        </div>

        {/* Score Ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r={radius} fill="none"
              stroke={getScoreColor(analysis.skin_score)} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={scoreOffset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.5s" }}
            />
            <text x="40" y="38" textAnchor="middle" fill={getScoreColor(analysis.skin_score)} fontSize="20" fontWeight="700">{analysis.skin_score}</text>
            <text x="40" y="52" textAnchor="middle" fill="var(--text-muted)" fontSize="10">/ 100</text>
          </svg>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: getScoreColor(analysis.skin_score) }}>{getScoreLabel(analysis.skin_score)}</div>
          </div>
        </div>
      </div>

      {/* Urgent Flag */}
      {analysis.urgent_flag && (
        <div style={{ 
          background: "rgba(239, 68, 68, 0.1)", 
          border: "1px solid rgba(239, 68, 68, 0.3)", 
          borderRadius: "12px", 
          padding: "16px 20px", 
          marginBottom: '20px',
          display: "flex", 
          alignItems: "flex-start", 
          gap: "12px" 
        }}>
          <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f87171", marginBottom: "4px" }}>
              Professional Consultation Recommended
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {result?.urgentReason || "Please consult a dermatologist for further evaluation."}
            </div>
          </div>
        </div>
      )}

      {/* Photo + Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Photo */}
        <div className="glass-card-static" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Analysis Photo</h3>
          {signedImageUrl ? (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
              <img 
                src={signedImageUrl} 
                alt="Analysis photo"
                style={{ width: '100%', display: 'block', borderRadius: '12px' }}
              />
              <div style={{
                position: 'absolute', bottom: '8px', left: '8px',
                background: 'rgba(6,6,18,0.8)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(45,212,191,0.3)',
                borderRadius: '6px', padding: '3px 8px',
                fontSize: '10px', color: '#2dd4bf'
              }}>
                🛡 FaceDefender™ Protected
              </div>
            </div>
          ) : (
            <div style={{
              aspectRatio: '1', borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: '8px'
            }}>
              <span style={{ fontSize: '32px', opacity: 0.3 }}>📷</span>
              <span style={{ fontSize: '12px', color: '#8892a4' }}>
                Photo not available
              </span>
              <span style={{ fontSize: '10px', color: '#4a5568', textAlign: 'center', padding: '0 16px' }}>
                Photos from before storage was enabled are not stored
              </span>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="glass-card-static" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Summary</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{result?.summary || 'No summary available.'}</p>
        </div>
      </div>

      {/* Skin Profile Strip */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div className="glass-card-static" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Skin</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-teal)', textTransform: 'capitalize' }}>{result?.skinType || 'Unknown'}</span>
        </div>
        <div className="glass-card-static" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fitzpatrick</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-lavender)' }}>
            Type {result?.fitzpatrickScale || '—'}
          </span>
        </div>
        <div className="glass-card-static" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hydration</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa' }}>{result?.hydration?.level?.replace(/_/g, ' ') || 'N/A'}</span>
        </div>
        <div className="glass-card-static" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Age</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f472b6' }}>{result?.aging?.perceivedSkinAge || '—'} yrs</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Acne */}
        <div className="glass-card-static" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Acne Analysis</h4>
          {result?.acne?.present ? (
            <>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ 
                    width: '18px', height: '18px', borderRadius: '50%', 
                    background: i <= (result.acne?.severityScore || 0) ? 'var(--accent-teal)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }} />
                ))}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{result.acne.severity}</div>
            </>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No significant acne detected</div>
          )}
        </div>

        {/* Pigmentation */}
        <div className="glass-card-static" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Pigmentation</h4>
          {result?.pigmentation?.present ? (
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-lavender)', textTransform: 'capitalize' }}>
                {result.pigmentation.type?.replace(/_/g, ' ') || 'Unknown'}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {result.pigmentation.distribution} • {result.pigmentation.severity}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No significant pigmentation</div>
          )}
        </div>

        {/* Texture */}
        <div className="glass-card-static" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Texture</h4>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Smoothness</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-teal)' }}>{result?.texture?.smoothnessScore || 0}/100</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${result?.texture?.smoothnessScore || 0}%`, height: '100%', background: 'var(--accent-teal)', borderRadius: '2px' }} />
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Pores: {result?.texture?.poreVisibility || 'N/A'}</div>
        </div>

        {/* Hydration & Oiliness */}
        <div className="glass-card-static" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Hydration & Oiliness</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>Hydration</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa' }}>{result?.hydration?.level?.replace(/_/g, ' ') || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Oiliness</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', textTransform: 'capitalize' }}>{result?.oiliness?.level || 'N/A'}</span>
          </div>
        </div>

        {/* Redness */}
        <div className="glass-card-static" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Redness</h4>
          {result?.redness?.present ? (
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f87171', textTransform: 'capitalize' }}>
                {result.redness.type?.replace(/_/g, ' ') || 'Present'}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{result.redness.severity}</div>
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No significant redness</div>
          )}
        </div>

        {/* Aging */}
        <div className="glass-card-static" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Aging</h4>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f472b6', marginBottom: '4px' }}>
            Est. Age: {result?.aging?.perceivedSkinAge || '—'} yrs
          </div>
          {result?.aging?.visibleAgeMarkers && result.aging.visibleAgeMarkers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {result.aging.visibleAgeMarkers.map((marker, i) => (
                <span key={i} style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(244,114,182,0.1)', borderRadius: '4px', color: '#f472b6', textTransform: 'capitalize' }}>
                  {marker.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Concerns */}
      {result?.concerns && result.concerns.length > 0 && (
        <div className="glass-card-static" style={{ padding: '20px', marginBottom: '24px', borderLeft: '3px solid #f97316' }}>
          <h3 style={{ fontSize: '0.8rem', color: '#f97316', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Clinical Findings</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {result.concerns.map((concern, i) => (
              <span key={i} style={{ fontSize: '0.85rem', background: 'rgba(249,115,22,0.1)', color: '#f97316', padding: '6px 12px', borderRadius: '8px' }}>
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result?.recommendations && result.recommendations.length > 0 && (
        <div className="glass-card-static" style={{ padding: '20px', marginBottom: '24px', borderLeft: '3px solid #22c55e' }}>
          <h3 style={{ fontSize: '0.8rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Recommendations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: '#22c55e', fontSize: '0.7rem', marginTop: '2px' }}>•</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <Link href={`/dashboard/routine?analysisId=${analysis.id}`} className="glass-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} /> Generate Routine Based on This <ChevronRight size={16} />
        </Link>
        <Link href={`/dashboard/products?analysisId=${analysis.id}`} className="glass-button-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={16} /> Find Matching Products
        </Link>
        <Link href={`/dashboard/journal?score=${analysis.skin_score}`} className="glass-button-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={16} /> Add to Journal
        </Link>
        <button 
          onClick={handleDelete} 
          disabled={deleting}
          className="glass-button-secondary"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
        >
          <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete This Analysis'}
        </button>
      </div>
    </div>
  );
}
