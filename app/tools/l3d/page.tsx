"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Search, Filter, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface HistoryItem {
  id: string;
  query: string;
  mode: string;
  days: number;
  status: 'running' | 'completed' | 'failed';
  timestamp: number;
  completed_at?: number;
  results?: any;
  error?: string;
}

export default function L3DPage() {
  // Input state
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"quick" | "balanced" | "deep">("balanced");
  const [days, setDays] = useState(30);
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
      const res = await fetch('/api/l3d/history');
      const data = await res.json();
      setHistory(data.history || []);
      setHistoryLoading(false);
    } catch (err) {
      console.error('Failed to load history:', err);
      setHistoryLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch('/api/l3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), mode, days }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Research started! Processing: "${topic.trim()}". Check history below for results.`);
        setTopic('');
        
        // Reload history immediately to show the new "running" item
        loadHistory();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || 'Failed to start research');
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
      const itemQuery = item.query?.toLowerCase() || "";
      const resultsStr = JSON.stringify(item.results || "").toLowerCase();
      const errorStr = (item.error || "").toLowerCase();
      
      return itemQuery.includes(query) || resultsStr.includes(query) || errorStr.includes(query);
    }
    
    return true;
  });

  const formatTimestamp = (timestamp: number) => {
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

  const getSummary = (results: any) => {
    if (!results) return "No results available";
    
    // Handle different result structures
    if (results.learned && Array.isArray(results.learned) && results.learned.length > 0) {
      const firstSection = results.learned[0];
      if (firstSection.content) {
        const text = firstSection.content;
        return text.substring(0, 300) + (text.length > 300 ? '...' : '');
      }
    }
    
    if (results.summary) {
      return results.summary.substring(0, 300) + (results.summary.length > 300 ? '...' : '');
    }
    
    if (typeof results === 'string') {
      return results.substring(0, 300) + (results.length > 300 ? '...' : '');
    }
    
    // Fallback: stringify and truncate
    const str = JSON.stringify(results);
    return str.substring(0, 300) + (str.length > 300 ? '...' : '');
  };

  const renderFullResults = (results: any) => {
    if (!results) return <div style={{ color: '#64748b' }}>No results available</div>;

    // L3D specific structure
    if (results.parsed || results.learned || results.keyPatterns) {
      return (
        <div>
          {/* Parsed Intent */}
          {results.parsed && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(0, 170, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 170, 255, 0.3)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#00aaff', marginBottom: '8px' }}>Parsed Intent</h3>
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                <div><strong>Topic:</strong> {results.parsed.topic}</div>
                {results.parsed.targetTool && <div><strong>Target Tool:</strong> {results.parsed.targetTool}</div>}
                <div><strong>Query Type:</strong> {results.parsed.queryType}</div>
              </div>
            </div>
          )}

          {/* What I Learned */}
          {results.learned && results.learned.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6', marginBottom: '12px' }}>📚 What I Learned</h3>
              {results.learned.map((section: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '16px', padding: '14px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#60a5fa', marginBottom: '8px' }}>{section.title}</h4>
                  <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{section.content}</div>
                  {section.sources && section.sources.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                      Sources: {section.sources.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Key Patterns */}
          {results.keyPatterns && results.keyPatterns.length > 0 && (
            <div style={{ marginBottom: '24px', padding: '14px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#a78bfa', marginBottom: '8px' }}>🔑 Key Patterns</h3>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                {results.keyPatterns.map((pattern: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>{pattern}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Stats */}
          {results.stats && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#00aaff', marginBottom: '12px' }}>📊 Stats</h3>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.8' }}>
                {results.stats.reddit && (
                  <div>├─ 🟠 Reddit: {results.stats.reddit.threads} threads │ {results.stats.reddit.upvotes} upvotes │ {results.stats.reddit.comments} comments</div>
                )}
                {results.stats.x && (
                  <div>├─ 🔵 X: {results.stats.x.posts} posts │ {results.stats.x.likes} likes │ {results.stats.x.reposts} reposts</div>
                )}
                {results.stats.web && (
                  <div>├─ 🌐 Web: {results.stats.web.pages} pages</div>
                )}
                {results.stats.topVoices && results.stats.topVoices.length > 0 && (
                  <div>└─ 🗣️ Top voices: {results.stats.topVoices.join(', ')}</div>
                )}
              </div>
            </div>
          )}

          {/* Invitation */}
          {results.invitation && (
            <div style={{ marginBottom: '24px', padding: '14px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: '13px', color: '#86efac', lineHeight: '1.6' }}>💬 {results.invitation}</div>
            </div>
          )}

          {/* Sources */}
          {results.sources && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#00aaff', marginBottom: '10px' }}>Sources</h3>
              
              {results.sources.reddit && results.sources.reddit.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '12px', color: '#fb923c', marginBottom: '8px' }}>🟠 Reddit ({results.sources.reddit.length})</h4>
                  {results.sources.reddit.map((source: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '8px', padding: '10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}>
                        {source.title}
                      </a>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        r/{source.subreddit} │ {source.upvotes} upvotes │ {source.comments} comments
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.sources.x && results.sources.x.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '8px' }}>🔵 X Posts ({results.sources.x.length})</h4>
                  {results.sources.x.map((source: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '8px', padding: '10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>{source.content}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        @{source.author} │ {source.likes} likes │ {source.reposts} reposts
                      </div>
                      {source.url && (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '11px', textDecoration: 'none' }}>
                          View post →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {results.sources.web && results.sources.web.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '12px', color: '#10b981', marginBottom: '8px' }}>🌐 Web Pages ({results.sources.web.length})</h4>
                  {results.sources.web.map((source: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '8px', padding: '10px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '12px', textDecoration: 'none' }}>
                        {source.title}
                      </a>
                      {source.snippet && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{source.snippet}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Fallback: Show as formatted JSON
    return (
      <div style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap', color: '#94a3b8' }}>
        {JSON.stringify(results, null, 2)}
      </div>
    );
  };

  return (
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
          <TrendingUp size={48} style={{ color: '#00aaff' }} />
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0,
          }}>
            L3D Research
          </h1>
        </div>
        
        <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px' }}>
          Research any topic from the last 30 days across Reddit, X, and web
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
            placeholder="Enter topic to research recent trends..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
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

          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(["quick", "balanced", "deep"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: mode === m ? 'rgba(0, 170, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: mode === m ? '1px solid rgba(0, 170, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: mode === m ? '#00aaff' : 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textTransform: 'capitalize',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Days Selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[7, 14, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: days === d ? 'rgba(0, 170, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: days === d ? '1px solid rgba(0, 170, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: days === d ? '#00aaff' : 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {d} days
              </button>
            ))}
          </div>

          {/* Research Button */}
          <button
            onClick={handleSearch}
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
            <TrendingUp size={20} />
            {loading ? 'Researching...' : 'Research'}
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
              Past L3D searches and results
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
                        {item.query}
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
                            View Full Report →
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
                    Full Report
                  </h2>
                  <p style={{
                    fontSize: '13px',
                    color: '#94a3b8',
                    margin: 0,
                  }}>
                    {fullReportItem.query}
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
                {renderFullResults(fullReportItem.results)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
