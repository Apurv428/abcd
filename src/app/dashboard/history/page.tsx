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
    if (score >= 60) return "#eab308";
    return "#ef4444";
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Analysis History</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track your skin, hair, and body health journey</p>
        </div>
      </div>

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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    <Calendar size={12} />
                    {format(new Date(record.created_at), "MMM d, yyyy")}
                  </div>
                  <div style={{ 
                    fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "1px", 
                    color: "var(--accent-teal)", fontWeight: 700, background: "rgba(45, 212, 191, 0.1)",
                    padding: "2px 8px", borderRadius: "4px"
                  }}>
                    {record.analysis_json.category || "Face"}
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
