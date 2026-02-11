"use client";

import { useState, useEffect } from "react";
import { Sparkles, Search, Filter, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle, ExternalLink } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

interface ContentItem {
  title: string;
  url: string;
  source_type: string;
  source_name: string;
  summary: string;
  estimated_minutes: number;
  worldview_score: number;
  worldview_reasoning: string;
  category: string;
}

interface HistoryItem {
  id: string;
  topic: string | null;
  source: string | null;
  mode: string;
  triggered_by: string;
  timestamp: string;
  total_items: number;
  status: 'running' | 'completed' | 'failed';
  results?: {
    'short-unique': ContentItem[];
    'short-trending': ContentItem[];
    'long-unique': ContentItem[];
    'long-trending': ContentItem[];
  };
  error?: string;
}

export default function CuratePage() {
  // Input state
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState<string>("mixed");
  const [count, setCount] = useState(12);
  const [minScore, setMinScore] = useState(5.0);
  const [timeRange, setTimeRange] = useState<string>("month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fullReportItem, setFullReportItem] = useState<HistoryItem | null>(null);

  // Load history on mount and poll every 5 seconds
  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/curate/history');
      const data = await res.json();
      setHistory(data.history || []);
      setHistoryLoading(false);
    } catch (err) {
      console.error('Failed to load history:', err);
      setHistoryLoading(false);
    }
  };

  const handleCurate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: topic.trim(), 
          source: source === "mixed" ? null : source,
          count,
          minScore,
          timeRange
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Curation started! Processing: "${topic.trim()}". Check history below for results.`);
        setTopic('');
        
        // Reload history immediately to show the new "running" item
        loadHistory();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || 'Failed to start curation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const topicStr = (item.topic || "").toLowerCase();
      const resultsStr = JSON.stringify(item.results || "").toLowerCase();
      
      return topicStr.includes(query) || resultsStr.includes(query);
    }
    
    return true;
  });

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "Unknown";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Unknown";
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      return "Unknown";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock size={16} className="animate-spin" style={{ color: '#3b82f6' }} />;
      case 'completed':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />;
      case 'failed':
        return <XCircle size={16} style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return '#10b981'; // green
    if (score >= 7) return '#3b82f6'; // blue
    if (score >= 5) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getCategoryDisplay = (category: string) => {
    const map: Record<string, string> = {
      'short-unique': 'Short & Unique',
      'short-trending': 'Short & Trending',
      'long-unique': 'Long & Unique',
      'long-trending': 'Long & Trending',
    };
    return map[category] || category;
  };

  const getSummary = (results: any) => {
    if (!results) return "No results available";
    
    // Count total items across categories
    let totalItems = 0;
    const categories: Array<'short-unique' | 'short-trending' | 'long-unique' | 'long-trending'> = ['short-unique', 'short-trending', 'long-unique', 'long-trending'];
    categories.forEach(cat => {
      const items = results[cat];
      if (items && Array.isArray(items)) {
        totalItems += items.length;
      }
    });
    
    if (totalItems === 0) return "No items found";
    
    // Get top item by score
    let topItem: ContentItem | null = null;
    let topScore = 0;
    
    categories.forEach(cat => {
      const items: ContentItem[] = results[cat] || [];
      if (Array.isArray(items)) {
        items.forEach((item: ContentItem) => {
          if (item.worldview_score > topScore) {
            topScore = item.worldview_score;
            topItem = item;
          }
        });
      }
    });
    
    if (topItem) {
      const item = topItem as ContentItem;
      return `Found ${totalItems} items. Top: "${item.title}" (${topScore}/10)`;
    }
    
    return `Found ${totalItems} intellectually stimulating items`;
  };

  const renderFullResults = (item: HistoryItem) => {
    if (!item.results) return <div style={{ color: '#64748b' }}>No results available</div>;

    const categories = [
      { key: 'short-unique', emoji: '⚡', color: '#a78bfa' },
      { key: 'short-trending', emoji: '🔥', color: '#f59e0b' },
      { key: 'long-unique', emoji: '📚', color: '#3b82f6' },
      { key: 'long-trending', emoji: '🌟', color: '#10b981' },
    ];

    return (
      <div>
        {/* Metadata */}
        <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(0, 170, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 170, 255, 0.3)' }}>
          <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
            <div><strong>Topic:</strong> {item.topic || 'General'}</div>
            <div><strong>Source:</strong> {item.source || 'Mixed'}</div>
            <div><strong>Total Items:</strong> {item.total_items}</div>
            <div><strong>Triggered By:</strong> {item.triggered_by}</div>
          </div>
        </div>

        {/* Categories */}
        {categories.map(({ key, emoji, color }) => {
          const items: ContentItem[] = (item.results?.[key as keyof typeof item.results] as ContentItem[]) || [];
          if (items.length === 0) return null;

          return (
            <div key={key} style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{emoji}</span>
                {getCategoryDisplay(key)} ({items.length})
              </h3>
              
              {items.map((contentItem: ContentItem, idx: number) => (
                <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {/* Title + Score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                    <a 
                      href={contentItem.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        color: '#60a5fa', 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        textDecoration: 'none',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {contentItem.title}
                      <ExternalLink size={14} style={{ flexShrink: 0 }} />
                    </a>
                    
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      background: `${getScoreColor(contentItem.worldview_score)}20`,
                      border: `1px solid ${getScoreColor(contentItem.worldview_score)}40`,
                      color: getScoreColor(contentItem.worldview_score),
                      fontSize: '12px',
                      fontWeight: '700',
                      flexShrink: 0,
                    }}>
                      {contentItem.worldview_score.toFixed(1)}/10
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', lineHeight: '1.6' }}>
                    {contentItem.summary}
                  </div>

                  {/* Reasoning */}
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '10px', padding: '10px', background: 'rgba(0, 170, 255, 0.05)', borderRadius: '6px', border: '1px solid rgba(0, 170, 255, 0.2)' }}>
                    <strong style={{ color: '#00aaff' }}>Why it scores {contentItem.worldview_score}/10:</strong> {contentItem.worldview_reasoning}
                  </div>

                  {/* Meta */}
                  <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '12px' }}>
                    <span>📍 {contentItem.source_type}</span>
                    <span>🔗 {contentItem.source_name}</span>
                    <span>⏱️ ~{contentItem.estimated_minutes} min</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <TopNav />
      <ToolNav currentToolId="curate" />
      <div style={{
        minHeight: '100vh',
        background: '#0a0e27',
        paddingTop: '136px',
        paddingBottom: '32px',
        paddingLeft: '24px',
        paddingRight: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <Sparkles size={48} style={{ color: '#00aaff' }} />
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0,
          }}>
            Curate
          </h1>
        </div>
        
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '8px' }}>
          Find intellectually stimulating content - especially content that challenges your beliefs
        </p>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '40px', fontStyle: 'italic' }}>
          "Strength through competition and struggle, not atrophy by protectionism."
        </p>

        {/* Input Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
        }}>
          {/* Topic Input */}
          <input
            type="text"
            placeholder="Enter topic to curate (e.g., 'Austrian economics', 'Federal Reserve', 'NBA analytics')..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleCurate()}
            disabled={loading}
            style={{
              width: '100%',
              padding: '20px 24px',
              fontSize: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(0, 170, 255, 0.3)',
              borderRadius: '12px',
              color: 'white',
              outline: 'none',
              marginBottom: '16px',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'text',
            }}
          />

          {/* Source Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', display: 'block' }}>
              Source Type
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                outline: 'none',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <option value="mixed">Mixed (Web + X + Reddit)</option>
              <option value="x">X/Twitter</option>
              <option value="reddit">Reddit</option>
              <option value="youtube">YouTube</option>
              <option value="rumble">Rumble</option>
              <option value="spotify">Spotify</option>
            </select>
          </div>

          {/* Count Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', display: 'block' }}>
              Number of Items (total across 4 categories)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[6, 12, 18, 24].map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: count === c ? 'rgba(0, 170, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: count === c ? '1px solid rgba(0, 170, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: count === c ? '#00aaff' : 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Min Score Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', display: 'block' }}>
              Minimum Intellectual Rigor Score (0-10)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[4.0, 5.0, 6.0, 7.0, 8.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setMinScore(s)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: minScore === s ? 'rgba(0, 170, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: minScore === s ? '1px solid rgba(0, 170, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: minScore === s ? '#00aaff' : 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {s}+
                </button>
              ))}
            </div>
          </div>

          {/* Time Range Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', display: 'block' }}>
              Time Range (how far back to search)
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: 'day', label: '1 Day' },
                { value: 'week', label: '1 Week' },
                { value: 'month', label: '1 Month' },
                { value: 'year', label: '1 Year' },
                { value: 'decade', label: '10 Years' },
                { value: 'any', label: 'Any Time' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTimeRange(t.value)}
                  disabled={loading}
                  style={{
                    flex: '1 1 calc(33.333% - 8px)',
                    minWidth: '120px',
                    padding: '12px',
                    background: timeRange === t.value ? 'rgba(0, 170, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: timeRange === t.value ? '1px solid rgba(0, 170, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: timeRange === t.value ? '#00aaff' : 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Curate Button */}
          <button
            onClick={handleCurate}
            disabled={loading || !topic.trim()}
            style={{
              width: '100%',
              padding: '16px',
              background: loading || !topic.trim() 
                ? 'rgba(0, 170, 255, 0.5)' 
                : 'linear-gradient(135deg, #00aaff, #0088cc)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Sparkles size={20} />
            {loading ? 'Curating...' : 'Curate'}
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <AlertCircle size={20} style={{ color: '#fca5a5', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ color: '#fca5a5', fontSize: '14px' }}>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: '#86efac',
            fontSize: '14px',
          }}>
            ✓ {success}
          </div>
        )}

        {/* History Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px',
            }}>
              History
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Past curations and results
            </p>
          </div>

          {/* Search + Filter Row */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 300px', position: 'relative' }}>
              <Search size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }} />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 44px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Filter size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                pointerEvents: 'none',
              }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '10px 40px 10px 44px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="running">Running</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* History Items */}
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading history...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No history found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Collapsed View */}
                  <div
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    <div style={{ flexShrink: 0 }}>
                      {getStatusIcon(item.status)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'white',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.topic || 'General Curation'}
                      </div>
                    </div>

                    <div style={{
                      fontSize: '12px',
                      color: '#64748b',
                      flexShrink: 0,
                    }}>
                      {formatTimestamp(item.timestamp)}
                    </div>

                    <div style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: `${getStatusColor(item.status)}20`,
                      color: getStatusColor(item.status),
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      flexShrink: 0,
                    }}>
                      {item.status}
                    </div>

                    <div style={{ flexShrink: 0, color: '#64748b' }}>
                      {expandedId === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded View */}
                  {expandedId === item.id && (
                    <div style={{
                      padding: '16px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(0, 0, 0, 0.2)',
                    }}>
                      {item.status === 'failed' && item.error && (
                        <div style={{
                          padding: '12px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#fca5a5',
                          fontSize: '13px',
                          marginBottom: '12px',
                        }}>
                          <strong>Error:</strong> {item.error}
                        </div>
                      )}

                      {item.status === 'completed' && item.results && (
                        <div>
                          <div style={{
                            fontSize: '13px',
                            color: '#cbd5e1',
                            lineHeight: '1.6',
                            marginBottom: '12px',
                            padding: '12px',
                            borderRadius: '6px',
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}>
                            {getSummary(item.results)}
                          </div>
                          <button
                            onClick={() => setFullReportItem(item)}
                            style={{
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #00aaff, #0088cc)',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            View Full Results →
                          </button>
                        </div>
                      )}

                      {item.status === 'running' && (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px',
                          color: '#64748b',
                        }}>
                          Processing... check back in a moment
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full Report Modal */}
        {fullReportItem && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
            onClick={() => setFullReportItem(null)}
          >
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.95)',
                borderRadius: '16px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '32px',
                backdropFilter: 'blur(20px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}>
                <div>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'white',
                    margin: 0,
                    marginBottom: '4px',
                  }}>
                    Curation Results
                  </h2>
                  <p style={{
                    fontSize: '13px',
                    color: '#94a3b8',
                    margin: 0,
                  }}>
                    {fullReportItem.topic || 'General'}
                  </p>
                </div>
                <button
                  onClick={() => setFullReportItem(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '20px',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                fontSize: '14px',
                color: '#cbd5e1',
                lineHeight: '1.8',
                maxHeight: '60vh',
                overflowY: 'auto',
              }}>
                {renderFullResults(fullReportItem)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    <BottomNav />
  </>
  );
}
