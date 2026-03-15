"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  History, Calendar, Shield, AlertTriangle, 
  ChevronRight, Search, Trash2, TrendingUp, TrendingDown, Minus
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase";
import { getAnalysisImageUrl } from "@/lib/analysis-images";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

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
    acne?: { severity?: string; severityScore?: number };
    hydration?: { level?: string };
    fitzpatrickScale?: number;
    fitzpatrickDescription?: string;
  };
}

type FilterType = 'all' | 'week' | 'month' | 'highScore' | 'acne' | 'urgent';
type SortType = 'newest' | 'oldest' | 'scoreHigh' | 'scoreLow';

export default function AnalysisHistoryPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const supabase = createClient();

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('skin_analyses')
        .select('id, image_url, skin_score, urgent_flag, analysis_json, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      console.log('[History] Fetched analyses count:', data?.length)
      data?.forEach(a => {
        console.log(`[History] Analysis ${a.id}: image_url =`, a.image_url)
      })
      
      setRecords((data as AnalysisRecord[]) || []);

      // Fetch signed URLs for images
      const urls: Record<string, string> = {};
      await Promise.all(
        (data || []).map(async (record) => {
          if (record.image_url) {
            const url = await getAnalysisImageUrl(record.image_url);
            if (url) urls[record.id] = url;
          }
        })
      );
      console.log('[History] Generated signed URLs for', Object.keys(urls).length, 'images')
      setImageUrls(urls);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  const isMockData = (record: AnalysisRecord) => {
    const summary = (record.analysis_json?.summary || '').toLowerCase();
    return summary.includes('rate limit') || summary.includes('sample') || summary.includes('demo mode') || summary.includes('unavailable');
  };

  const stats = useMemo(() => {
    const scores = records.filter(r => !isMockData(r)).map(r => r.skin_score).filter(Boolean);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length ? Math.max(...scores) : 0;
    
    const allConcerns = records
      .filter(r => !isMockData(r))
      .flatMap(r => r.analysis_json?.concerns || []);
    const concernFreq: Record<string, number> = {};
    allConcerns.forEach(c => { concernFreq[c] = (concernFreq[c] || 0) + 1; });
    const topConcern = Object.entries(concernFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';
    
    return { total: records.filter(r => !isMockData(r)).length, avgScore, bestScore, topConcern };
  }, [records]);

  const trend = useMemo(() => {
    const realRecords = records.filter(r => !isMockData(r));
    if (realRecords.length < 2) return 'stable';
    
    const first3 = realRecords.slice(-3).map(r => r.skin_score);
    const last3 = realRecords.slice(0, 3).map(r => r.skin_score);
    const firstAvg = first3.reduce((a, b) => a + b, 0) / first3.length;
    const lastAvg = last3.reduce((a, b) => a + b, 0) / last3.length;
    const diff = lastAvg - firstAvg;
    
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = records.filter(r => {
      const matchesSearch = !searchTerm || 
        r.analysis_json?.concerns?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.analysis_json?.skinType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.analysis_json?.summary?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (filter === 'all') return true;
      if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(r.created_at) >= weekAgo;
      }
      if (filter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(r.created_at) >= monthAgo;
      }
      if (filter === 'highScore') return r.skin_score >= 80;
      if (filter === 'acne') return r.analysis_json?.acne?.severity && r.analysis_json.acne.severity !== 'none';
      if (filter === 'urgent') return r.urgent_flag;
      return true;
    });

    if (sort === 'newest') result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sort === 'oldest') result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else if (sort === 'scoreHigh') result = [...result].sort((a, b) => b.skin_score - a.skin_score);
    else if (sort === 'scoreLow') result = [...result].sort((a, b) => a.skin_score - b.skin_score);

    return result;
  }, [records, searchTerm, filter, sort]);

  const chartData = useMemo(() => {
    return records
      .filter(r => !isMockData(r))
      .slice()
      .reverse()
      .map(r => ({
        date: new Date(r.created_at),
        score: r.skin_score,
        skinType: r.analysis_json?.skinType || 'Unknown',
        concerns: r.analysis_json?.concerns || [],
        acne: r.analysis_json?.acne?.severity || 'none',
        formattedDate: format(new Date(r.created_at), 'MMM d, h:mm a')
      }));
  }, [records]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 65) return "#2dd4bf";
    if (score >= 50) return "#f59e0b";
    if (score >= 35) return "#f97316";
    return "#ef4444";
  };

  const getScoreTier = (score: number) => {
    if (score >= 80) return 'good';
    if (score >= 65) return 'fair';
    if (score >= 50) return 'moderate';
    if (score >= 35) return 'poor';
    return 'critical';
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this analysis?")) return;
    try {
      await supabase.from('skin_analyses').delete().eq('id', id);
      setRecords(records.filter(r => r.id !== id));
    } catch (err) { console.error("Delete failed:", err); }
  };

  const getTrendDisplay = () => {
    if (trend === 'improving') return { text: '↑ Improving', color: '#22c55e', icon: TrendingUp };
    if (trend === 'declining') return { text: '↓ Declining', color: '#ef4444', icon: TrendingDown };
    return { text: '→ Stable', color: '#f59e0b', icon: Minus };
  };
  const trendDisplay = getTrendDisplay();

  const getSubtitle = () => {
    if (stats.total === 0) return "No analyses yet — take your first scan";
    if (stats.total === 1) return "1 analysis recorded";
    return `${stats.total} analyses · avg: ${stats.avgScore} · best: ${stats.bestScore}`;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { date: Date; score: number; skinType: string; concerns: string[]; acne: string; formattedDate: string } }[] }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div style={{ background: 'rgba(10,10,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px' }}>
        <p style={{ fontSize: '0.8rem', color: '#8892a4', marginBottom: '4px' }}>{data.formattedDate}</p>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: getScoreColor(data.score) }}>Score: {data.score}/100</p>
        <p style={{ fontSize: '0.75rem', color: '#c8d0db' }}>{data.skinType}</p>
        {data.concerns.length > 0 && (
          <p style={{ fontSize: '0.7rem', color: '#f97316', marginTop: '4px' }}>Concern: {data.concerns[0]}</p>
        )}
        {data.acne !== 'none' && (
          <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '2px' }}>Acne: {data.acne}</p>
        )}
      </div>
    );
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'highScore', label: 'Score ≥ 80' },
    { id: 'acne', label: 'Acne Detected' },
    { id: 'urgent', label: 'Urgent ⚠️' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "4px" }}>Skin Analysis History</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            {getSubtitle()}
            {stats.total > 1 && (
              <span style={{ color: trendDisplay.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {trendDisplay.text}
              </span>
            )}
          </p>
        </div>
        <Link href="/dashboard/analyze" className="glass-button" style={{ display: "flex", alignItems: "center", gap: "6px", textDecoration: 'none', whiteSpace: 'nowrap' }}>
          New Analysis →
        </Link>
      </div>

      {/* Stats Strip */}
      {stats.total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: 'Total Scans', value: stats.total },
            { label: 'Average Score', value: `${stats.avgScore}/100` },
            { label: 'Best Score', value: `${stats.bestScore}/100` },
            { label: 'Top Concern', value: stats.topConcern.length > 15 ? stats.topConcern.slice(0, 15) + '...' : stats.topConcern },
          ].map((stat, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "14px" }}>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{stat.label}</p>
              <p style={{ fontSize: "1.1rem", fontWeight: 500, color: "var(--text-primary)" }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 ? (
        <div className="glass-card-static" style={{ padding: "20px", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "16px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Skin Score Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" label={{ value: 'Good', fontSize: 9, fill: '#22c55e', position: 'right' }} />
              <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Fair', fontSize: 9, fill: '#f59e0b', position: 'right' }} />
              <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Needs attention', fontSize: 9, fill: '#ef4444', position: 'right' }} />
              <Line type="monotone" dataKey="score" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 4, fill: '#0a0a1e', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : stats.total > 0 ? (
        <div className="glass-card-static" style={{ padding: "30px", marginBottom: "20px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "12px" }}>Take 2 or more analyses to see your skin score trend</p>
          <Link href="/dashboard/analyze" className="glass-button" style={{ display: "inline-flex", textDecoration: "none" }}>Analyze Now →</Link>
        </div>
      ) : null}

      {/* Filters & Search */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "12px" }}>
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "6px 14px", borderRadius: "20px", border: "none",
                background: filter === f.id ? "var(--accent-teal)" : "rgba(255,255,255,0.06)",
                color: filter === f.id ? "#060612" : "var(--text-muted)",
                fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="glass-input"
              style={{ paddingLeft: "36px", width: "100%" }}
              placeholder="Search by concern, skin type, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="glass-input"
            style={{ width: "auto", minWidth: "140px" }}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="scoreHigh">Highest Score</option>
            <option value="scoreLow">Lowest Score</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {[1,2,3,4].map(i => <div key={i} className="loading-shimmer" style={{ height: "220px", borderRadius: "16px" }} />)}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="glass-card-static" style={{ padding: "60px", textAlign: "center" }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ margin: "0 auto 20px", opacity: 0.5 }}>
            <circle cx="40" cy="35" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M25 55 Q40 70 55 55" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="33" cy="32" r="2" fill="currentColor" />
            <circle cx="47" cy="32" r="2" fill="currentColor" />
          </svg>
          <h3 style={{ fontWeight: 600, marginBottom: "8px" }}>No analyses yet</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>Take your first AI skin analysis to start tracking your skin health journey</p>
          <Link href="/dashboard/analyze" className="glass-button" style={{ display: "inline-block", textDecoration: "none" }}>Analyze My Skin →</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {filteredRecords.map((record) => {
            const isMock = isMockData(record);
            const tier = getScoreTier(record.skin_score);
            const scoreColor = getScoreColor(record.skin_score);
            
            const analysisType = record.analysis_json?.category || 'face';
            const typeConfig: Record<string, { label: string; emoji: string; color: string; border: string }> = {
              face: { label: 'Face', emoji: '👤', color: 'rgba(45,212,191,0.15)', border: 'rgba(45,212,191,0.3)' },
              body: { label: 'Body', emoji: '💪', color: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.3)' },
              hair: { label: 'Hair', emoji: '🧔', color: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)' },
            };
            const type = typeConfig[analysisType] || typeConfig.face;
            
            return (
              <Link
                key={record.id}
                href={`/dashboard/analyze/${record.id}`}
                style={{
                  textDecoration: "none",
                  display: "block",
                  borderRadius: "16px",
                  overflow: "hidden",
                  position: "relative",
                  opacity: isMock ? 0.7 : 1,
                  transition: "transform 0.2s, box-shadow 0.2s",
                  borderTop: `4px solid ${scoreColor}`,
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${scoreColor}20`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Test Scan Badge */}
                {isMock && (
                  <div style={{ position: "absolute", top: "12px", left: "12px", background: "#f59e0b", color: "#000", fontSize: "0.65rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", zIndex: 10 }}>
                    Test Scan
                  </div>
                )}

                <div style={{ padding: "18px" }}>
                  {/* Header: Image + Score Ring + Info + Date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                      {/* Image Thumbnail */}
                      {imageUrls[record.id] && (
                        <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={imageUrls[record.id]} alt="Analysis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      {/* Score Ring */}
                      <svg width="52" height="52" viewBox="0 0 52 52" style={{ flexShrink: 0 }}>
                        <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                        <circle
                          cx="26" cy="26" r="22" fill="none"
                          stroke={scoreColor} strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 22}
                          strokeDashoffset={2 * Math.PI * 22 * (1 - record.skin_score / 100)}
                          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.5s" }}
                        />
                        <text x="26" y="30" textAnchor="middle" fill={scoreColor} fontSize="14" fontWeight="700">{record.skin_score}</text>
                      </svg>
                      
                      {/* Info */}
                      <div>
                        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px", textTransform: "capitalize" }}>
                          {record.analysis_json?.skinType || 'Unknown'}
                        </p>
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {record.analysis_json?.fitzpatrickScale ? `Type ${record.analysis_json.fitzpatrickScale}` : 'Fitzpatrick Type'}
                        </p>
                        {(record.analysis_json?.acne?.severity || record.analysis_json?.hydration?.level) && (
                          <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {record.analysis_json?.acne?.severity && record.analysis_json.acne.severity !== 'none' && `${record.analysis_json.acne.severity} acne`}
                            {record.analysis_json?.acne?.severity && record.analysis_json?.hydration?.level && ' · '}
                            {record.analysis_json?.hydration?.level && `${record.analysis_json.hydration.level} hydration`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Date Badge */}
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontSize: '10px', padding: '2px 8px',
                        background: type.color, border: `1px solid ${type.border}`,
                        borderRadius: '10px', color: '#f0f4ff', display: 'inline-block', marginBottom: '4px'
                      }}>
                        {type.emoji} {type.label}
                      </span>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }} title={format(new Date(record.created_at), 'MMMM d, yyyy \'at\' h:mm a')}>
                        {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Urgent Flag */}
                  {record.urgent_flag && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.15)", padding: "6px 10px", borderRadius: "6px", marginBottom: "12px" }}>
                      <AlertTriangle size={12} color="#ef4444" />
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#ef4444" }}>Consult Dermatologist</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "12px" }} />

                  {/* Top Concerns */}
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Top concerns</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                    {record.analysis_json?.concerns?.slice(0, 3).map((c, i) => (
                      <span key={i} style={{ fontSize: "0.75rem", background: "rgba(249,115,22,0.1)", color: "#f97316", padding: "4px 10px", borderRadius: "6px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.length > 45 ? c.slice(0, 45) + '...' : c}
                      </span>
                    ))}
                    {record.analysis_json?.concerns?.length > 3 && (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "4px 8px" }}>+{record.analysis_json.concerns.length - 3} more</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--accent-teal)", display: "flex", alignItems: "center", gap: "4px" }}>
                      View Full Report <ChevronRight size={14} />
                    </span>
                    <button
                      onClick={(e) => handleDelete(record.id, e)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "var(--text-muted)", opacity: 0.6 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
