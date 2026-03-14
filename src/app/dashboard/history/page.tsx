"use client";

import { useState, useEffect } from "react";
import { 
  History, Calendar, Tag, Shield, AlertTriangle, 
  ChevronRight, ExternalLink, Image as ImageIcon, Search,
  Filter, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase";
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
    acne?: { severity?: string };
  };
}

function SimpleLineChart({ data }: { data: { date: string; score: number; acne: string }[] }) {
  const maxScore = 100;
  const minScore = 0;
  const range = maxScore - minScore;
  
  const width = 600;
  const height = 200;
  const padding = 40;
  
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((d.score - minScore) / range) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ overflowX: "auto", padding: "10px 0" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block", margin: "0 auto" }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line 
              x1={padding} 
              y1={height - padding - ((tick - minScore) / range) * (height - 2 * padding)} 
              x2={width - padding} 
              y2={height - padding - ((tick - minScore) / range) * (height - 2 * padding)} 
              stroke="rgba(255,255,255,0.06)" 
              strokeWidth="1" 
            />
            <text 
              x={padding - 10} 
              y={height - padding - ((tick - minScore) / range) * (height - 2 * padding) + 4} 
              fill="#4a5568" 
              fontSize="10" 
              textAnchor="end"
            >
              {tick}
            </text>
          </g>
        ))}
        
        {/* Line */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="#2dd4bf" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="6" 
              fill="#0a0a1e" 
              stroke="#2dd4bf" 
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
      
      {/* Custom tooltip would need more complex setup - showing simple labels below */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 40px", marginTop: "8px" }}>
        {data.slice(0, Math.min(data.length, 5)).map((d, i) => (
          <div key={i} style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center" }}>
            {d.date}
            <br />
            <span style={{ color: "#2dd4bf", fontWeight: 600 }}>{d.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    acne?: { severity?: string };
  };
}

export default function AnalysisHistoryPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("skin_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this analysis record?")) return;

    try {
      const { error } = await supabase
        .from("skin_analyses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesFilter = filter === "all" || r.analysis_json.category === filter;
    const matchesSearch = r.analysis_json.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.analysis_json.concerns.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 65) return "#2dd4bf";
    if (score >= 50) return "#f59e0b";
    if (score >= 35) return "#f97316";
    return "#ef4444";
  };

  const getSeverityColor = (severity: string | undefined) => {
    if (!severity || severity === "none") return "#22c55e";
    if (severity === "mild") return "#2dd4bf";
    if (severity === "moderate") return "#eab308";
    if (severity === "severe" || severity === "very_severe") return "#ef4444";
    return "#a78bfa";
  };

  const chartData = records
    .slice()
    .reverse()
    .slice(-10)
    .map(r => ({
      date: format(new Date(r.created_at), "MMM d"),
      score: r.skin_score,
      acne: r.analysis_json?.acne?.severity || "none"
    }));

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Analysis History</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track your skin, hair, and body health journey</p>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="glass-card-static" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "16px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Skin Score Over Time
          </h3>
          <SimpleLineChart data={chartData} />
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="glass-input"
            style={{ paddingLeft: "36px" }}
            placeholder="Search concerns or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="glass-input"
          style={{ width: "auto" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="face">Face</option>
          <option value="body">Body Skin</option>
          <option value="hair">Hair & Beard</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="loading-shimmer" style={{ height: "200px", borderRadius: "20px" }} />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="glass-card-static" style={{ padding: "60px", textAlign: "center" }}>
          <History size={48} color="var(--glass-border)" style={{ marginBottom: "16px" }} />
          <h3>No records found</h3>
          <p style={{ color: "var(--text-secondary)" }}>Your analysis journey starts with your first upload.</p>
          <Link href="/dashboard/analyze" className="glass-button" style={{ display: "inline-block", marginTop: "20px", textDecoration: "none" }}>
            Start New Analysis
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {filteredRecords.map((record) => (
            <div key={record.id} className="glass-card-static group" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "relative", height: "160px", background: "rgba(0,0,0,0.2)" }}>
                {record.image_url ? (
                  <img src={record.image_url} alt="Analysis" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                    <ImageIcon size={32} />
                  </div>
                )}
                <div style={{ 
                  position: "absolute", top: "12px", right: "12px", 
                  background: "rgba(10, 10, 26, 0.8)", backdropFilter: "blur(8px)",
                  borderRadius: "8px", padding: "4px 10px", border: "1px solid var(--glass-border)",
                  fontSize: "0.85rem", fontWeight: 700, color: getScoreColor(record.skin_score)
                }}>
                  {record.skin_score} <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>/100</span>
                </div>
                {record.urgent_flag && (
                  <div style={{ position: "absolute", top: "12px", left: "12px", background: "#ef4444", borderRadius: "50%", padding: "6px" }}>
                    <AlertTriangle size={14} color="white" />
                  </div>
                )}
              </div>
              
                <div style={{ padding: "16px", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    <Calendar size={12} />
                    {format(new Date(record.created_at), "MMM d, yyyy")}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {record.analysis_json?.acne?.severity && record.analysis_json.acne.severity !== "none" && (
                      <span style={{ 
                        fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.5px", 
                        color: getSeverityColor(record.analysis_json.acne.severity), 
                        background: `${getSeverityColor(record.analysis_json.acne.severity)}20`,
                        padding: "2px 6px", borderRadius: "4px", border: `0.6px solid ${getSeverityColor(record.analysis_json.acne.severity)}40`
                      }}>
                        {record.analysis_json.acne.severity}
                      </span>
                    )}
                    <span style={{ 
                      fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "1px", 
                      color: "var(--accent-teal)", fontWeight: 700, background: "rgba(45, 212, 191, 0.1)",
                      padding: "2px 8px", borderRadius: "4px"
                    }}>
                      {record.analysis_json.category || "Face"}
                    </span>
                  </div>
                </div>
                
                <p style={{ 
                  fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500,
                  display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical",
                  overflow: "hidden", marginBottom: "16px", lineHeight: 1.5
                }}>
                  {record.analysis_json.summary}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                  {record.analysis_json.concerns.slice(0, 2).map((c, i) => (
                    <span key={i} style={{ 
                      fontSize: "0.7rem", color: "var(--text-secondary)", background: "var(--glass-bg)",
                      padding: "3px 8px", borderRadius: "6px", border: "1px solid var(--glass-border)"
                    }}>
                      • {c}
                    </span>
                  ))}
                  {record.analysis_json.concerns.length > 2 && (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>+{record.analysis_json.concerns.length - 2} more</span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button 
                    onClick={(e) => handleDelete(record.id, e)}
                    className="glass-button-secondary" 
                    style={{ padding: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                  >
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                  <Link 
                    href={`/dashboard/analyze?id=${record.id}`} 
                    className="glass-button" 
                    style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.85rem", padding: "8px" }}
                  >
                    Full Details <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
