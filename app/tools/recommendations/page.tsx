"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Handshake, Plus, X, ExternalLink, User, Search, Filter, CheckCircle, Clock, Play, XCircle, Trash2 } from "lucide-react";

interface Recommendation {
  id: string;
  recommender: string;
  item: string;
  category: string;
  url: string;
  notes: string;
  status: 'new' | 'in_progress' | 'completed' | 'not_interested';
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

export default function RecommendationsPage() {
  return (
    <ProtectedRoute>
      <RecommendationsContent />
    </ProtectedRoute>
  );
}

function RecommendationsContent() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('recommendations', 'Recommendations', '#6366f1');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newRec, setNewRec] = useState({
    recommender: '',
    item: '',
    category: 'book',
    url: '',
    notes: '',
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations');
      const data = await response.json();
      setRecommendations(data.items || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRecommendation = async () => {
    if (!newRec.item.trim()) return;

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec),
      });

      if (response.ok) {
        const created = await response.json();
        setRecommendations([created, ...recommendations]);
        setNewRec({ recommender: '', item: '', category: 'book', url: '', notes: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error creating recommendation:', error);
    }
  };

  const updateStatus = async (id: string, newStatus: Recommendation['status']) => {
    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setRecommendations(recommendations.map(rec => 
          rec.id === id ? { ...rec, status: newStatus } : rec
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteRecommendation = async (id: string) => {
    if (!confirm('Delete this recommendation?')) return;

    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRecommendations(recommendations.filter(rec => rec.id !== id));
      }
    } catch (error) {
      console.error('Error deleting recommendation:', error);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = !searchQuery || 
      rec.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.recommender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || rec.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = ['book', 'movie', 'article', 'product', 'service', 'person', 'podcast', 'tool', 'other'];
  const allCategories = ['all', ...categories];
  const statuses: Recommendation['status'][] = ['new', 'in_progress', 'completed', 'not_interested'];

  const getStatusIcon = (status: Recommendation['status']) => {
    switch (status) {
      case 'new': return <Clock size={14} style={{ color: '#3b82f6' }} />;
      case 'in_progress': return <Play size={14} style={{ color: '#f59e0b' }} />;
      case 'completed': return <CheckCircle size={14} style={{ color: '#10b981' }} />;
      case 'not_interested': return <XCircle size={14} style={{ color: '#64748b' }} />;
    }
  };

  const getStatusColor = (status: Recommendation['status']) => {
    switch (status) {
      case 'new': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'not_interested': return '#64748b';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      book: '#8b5cf6',
      movie: '#ec4899',
      article: '#3b82f6',
      product: '#10b981',
      service: '#14b8a6',
      person: '#f59e0b',
      podcast: '#ef4444',
      tool: '#6366f1',
      other: '#64748b',
    };
    return colors[category] || colors.other;
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="recommendations" />
      
      <main style={{
        paddingTop: isMobile ? "80px" : "136px",
        paddingBottom: isMobile ? "80px" : "32px",
        paddingLeft: isMobile ? "12px" : "24px",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
        maxWidth: "1400px",
        margin: "0 auto",
      }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: isMobile ? "16px" : "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Handshake size={isMobile ? 32 : 40} style={{ color: "#ec4899" }} />
            <div>
              <h1 style={{
                fontSize: isMobile ? "24px" : "32px",
                fontWeight: "bold",
                color: "white",
                margin: 0,
              }}>{toolCustom.name}</h1>
              <p style={{ 
                fontSize: isMobile ? "12px" : "14px", 
                color: "#94a3b8", 
                margin: 0 
              }}>
                Track suggestions from people
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: isMobile ? "8px 16px" : "10px 20px",
              background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: isMobile ? "13px" : "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(236, 72, 153, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Plus size={16} />
            Add Recommendation
          </button>
        </div>

        {/* Filters */}
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          marginBottom: "20px", 
          flexWrap: "wrap",
        }}>
          <div style={{ flex: isMobile ? "1 1 100%" : "1 1 300px", position: "relative" }}>
            <Search size={16} style={{ 
              position: "absolute", 
              left: "12px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "#64748b" 
            }} />
            <input
              type="text"
              placeholder="Search recommendations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 40px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 12px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "8px",
              color: "white",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "10px 12px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "8px",
              color: "white",
              fontSize: "14px",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
              borderRadius: "16px",
              padding: isMobile ? "20px" : "32px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              border: "1px solid rgba(148, 163, 184, 0.1)",
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: "24px",
              }}>
                <h2 style={{ 
                  fontSize: isMobile ? "20px" : "24px", 
                  fontWeight: "bold", 
                  color: "white",
                  margin: 0,
                }}>
                  Add Recommendation
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewRec({ recommender: '', item: '', category: 'book', url: '', notes: '' });
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ 
                  display: "block", 
                  color: "#cbd5e1", 
                  fontSize: "13px",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}>
                  What was recommended? *
                </label>
                <input
                  type="text"
                  value={newRec.item}
                  onChange={(e) => setNewRec({ ...newRec, item: e.target.value })}
                  placeholder="e.g., Book title, Movie name, Product..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    color: "#cbd5e1", 
                    fontSize: "13px",
                    marginBottom: "6px",
                    fontWeight: "500",
                  }}>
                    Who recommended it?
                  </label>
                  <input
                    type="text"
                    value={newRec.recommender}
                    onChange={(e) => setNewRec({ ...newRec, recommender: e.target.value })}
                    placeholder="Person's name"
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    color: "#cbd5e1", 
                    fontSize: "13px",
                    marginBottom: "6px",
                    fontWeight: "500",
                  }}>
                    Category
                  </label>
                  <select
                    value={newRec.category}
                    onChange={(e) => setNewRec({ ...newRec, category: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "14px",
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ 
                  display: "block", 
                  color: "#cbd5e1", 
                  fontSize: "13px",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}>
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={newRec.url}
                  onChange={(e) => setNewRec({ ...newRec, url: e.target.value })}
                  placeholder="https://..."
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ 
                  display: "block", 
                  color: "#cbd5e1", 
                  fontSize: "13px",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}>
                  Notes
                </label>
                <textarea
                  value={newRec.notes}
                  onChange={(e) => setNewRec({ ...newRec, notes: e.target.value })}
                  placeholder="Additional context..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewRec({ recommender: '', item: '', category: 'book', url: '', notes: '' });
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "rgba(148, 163, 184, 0.1)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "8px",
                    color: "#cbd5e1",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={createRecommendation}
                  disabled={!newRec.item.trim()}
                  style={{
                    padding: "10px 20px",
                    background: newRec.item.trim() 
                      ? "linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
                      : "rgba(148, 163, 184, 0.1)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: newRec.item.trim() ? "pointer" : "not-allowed",
                    opacity: newRec.item.trim() ? 1 : 0.5,
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        {loading ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            color: "#94a3b8",
          }}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              border: "3px solid rgba(148, 163, 184, 0.2)",
              borderTop: "3px solid #ec4899",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }} />
            Loading recommendations...
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: isMobile ? "40px 20px" : "60px 40px",
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)",
            borderRadius: "16px",
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}>
            <Handshake size={48} style={{ color: "#64748b", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: "600", color: "white", marginBottom: "8px" }}>
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' 
                ? 'No matching recommendations' 
                : 'No recommendations yet'}
            </h3>
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start tracking suggestions from people'}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))",
            gap: isMobile ? "12px" : "16px",
          }}>
            {filteredRecommendations.map(rec => (
              <div
                key={rec.id}
                style={{
                  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  borderRadius: "12px",
                  padding: isMobile ? "14px" : "16px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${getCategoryColor(rec.category)}66`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start",
                  marginBottom: "10px",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <h3 style={{ 
                        fontSize: isMobile ? "15px" : "16px", 
                        fontWeight: "600", 
                        color: "white", 
                        margin: 0,
                        lineHeight: "1.3",
                      }}>
                        {rec.item}
                      </h3>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        background: `${getCategoryColor(rec.category)}22`,
                        border: `1px solid ${getCategoryColor(rec.category)}44`,
                        borderRadius: "10px",
                        fontSize: "10px",
                        fontWeight: "600",
                        color: getCategoryColor(rec.category),
                        textTransform: "capitalize",
                      }}>
                        {rec.category}
                      </span>
                    </div>
                    
                    {rec.recommender && (
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "4px",
                        fontSize: "12px",
                        color: "#94a3b8",
                        marginBottom: "8px",
                      }}>
                        <User size={12} />
                        From: {rec.recommender}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteRecommendation(rec.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "4px",
                      opacity: 0.6,
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {rec.notes && (
                  <p style={{
                    fontSize: "13px",
                    color: "#cbd5e1",
                    margin: "0 0 10px 0",
                    lineHeight: "1.5",
                  }}>
                    {rec.notes}
                  </p>
                )}

                {rec.url && (
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "#60a5fa",
                      textDecoration: "none",
                      marginBottom: "10px",
                    }}
                  >
                    <ExternalLink size={12} />
                    View Link
                  </a>
                )}

                <div style={{ 
                  display: "flex", 
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(148, 163, 184, 0.1)",
                  flexWrap: "wrap",
                }}>
                  {statuses.map(status => (
                    <button
                      key={status}
                      onClick={() => updateStatus(rec.id, status)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "4px 10px",
                        background: rec.status === status
                          ? `${getStatusColor(status)}33`
                          : "rgba(148, 163, 184, 0.1)",
                        border: rec.status === status
                          ? `1px solid ${getStatusColor(status)}66`
                          : "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "6px",
                        color: rec.status === status
                          ? getStatusColor(status)
                          : "#94a3b8",
                        fontSize: "11px",
                        fontWeight: rec.status === status ? "600" : "500",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (rec.status !== status) {
                          e.currentTarget.style.background = `${getStatusColor(status)}22`;
                          e.currentTarget.style.borderColor = `${getStatusColor(status)}44`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (rec.status !== status) {
                          e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                          e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                        }
                      }}
                    >
                      {getStatusIcon(status)}
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && recommendations.length > 0 && (
          <div style={{ 
            marginTop: "24px", 
            padding: "12px 16px", 
            background: "rgba(30, 41, 59, 0.4)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            borderRadius: "8px", 
            fontSize: "13px", 
            color: "#94a3b8", 
            textAlign: "center" 
          }}>
            Showing {filteredRecommendations.length} of {recommendations.length} recommendations
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
