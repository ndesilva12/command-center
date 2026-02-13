"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { TrendingUp, Plus, Trash2, ExternalLink, Mail, Phone, Linkedin, Building2, X } from "lucide-react";

interface Investor {
  id: string;
  name: string;
  firm: string;
  email: string;
  phone: string;
  linkedin: string;
  focus: {
    stage: string;
    sector: string;
    checkSize: string;
  };
  notes: string;
  stage: 'research' | 'outreach' | 'meeting' | 'follow_up' | 'committed' | 'passed';
  history: Array<{
    timestamp: number;
    from: string;
    to: string;
    note: string;
  }>;
  order: number;
  created_at: number;
  updated_at: number;
}

export default function InvestorsPage() {
  return (
    <ProtectedRoute>
      <InvestorsContent />
    </ProtectedRoute>
  );
}

function InvestorsContent() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('investors', 'Investors', '#6366f1');
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingInvestor, setViewingInvestor] = useState<Investor | null>(null);
  const [newInvestor, setNewInvestor] = useState({
    name: '',
    firm: '',
    email: '',
    phone: '',
    linkedin: '',
    focus: { stage: '', sector: '', checkSize: '' },
    notes: '',
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchInvestors();
  }, []);

  const fetchInvestors = async () => {
    try {
      const response = await fetch('/api/investors');
      const data = await response.json();
      setInvestors(data.items || []);
    } catch (error) {
      console.error('Error fetching investors:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInvestor = async () => {
    if (!newInvestor.name.trim()) return;

    try {
      const response = await fetch('/api/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvestor),
      });

      if (response.ok) {
        const created = await response.json();
        setInvestors([...investors, created]);
        setNewInvestor({
          name: '',
          firm: '',
          email: '',
          phone: '',
          linkedin: '',
          focus: { stage: '', sector: '', checkSize: '' },
          notes: '',
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error creating investor:', error);
    }
  };

  const updateInvestor = async (id: string, updates: Partial<Investor>) => {
    try {
      const response = await fetch(`/api/investors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setInvestors(investors.map(inv => 
          inv.id === id ? { ...inv, ...updates } : inv
        ));
      }
    } catch (error) {
      console.error('Error updating investor:', error);
    }
  };

  const deleteInvestor = async (id: string) => {
    if (!confirm('Delete this investor?')) return;

    try {
      const response = await fetch(`/api/investors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInvestors(investors.filter(inv => inv.id !== id));
      }
    } catch (error) {
      console.error('Error deleting investor:', error);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const investor = investors.find(inv => inv.id === draggableId);
    if (!investor) return;

    const sourceStage = source.droppableId as Investor['stage'];
    const destStage = destination.droppableId as Investor['stage'];

    const newInvestors = Array.from(investors);
    const sourceInvestors = newInvestors.filter(inv => inv.stage === sourceStage);
    const destInvestors = sourceStage === destStage 
      ? sourceInvestors 
      : newInvestors.filter(inv => inv.stage === destStage);

    const [removed] = sourceInvestors.splice(source.index, 1);
    
    if (sourceStage !== destStage) {
      removed.stage = destStage;
    }

    if (sourceStage === destStage) {
      sourceInvestors.splice(destination.index, 0, removed);
    } else {
      destInvestors.splice(destination.index, 0, removed);
    }

    const updateOrders = (items: Investor[]) => {
      return items.map((inv, idx) => ({ ...inv, order: idx }));
    };

    const updatedSource = updateOrders(sourceInvestors);
    const updatedDest = sourceStage === destStage ? updatedSource : updateOrders(destInvestors);

    const finalInvestors = newInvestors.map(inv => {
      const updated = [...updatedSource, ...updatedDest].find(u => u.id === inv.id);
      return updated || inv;
    });

    setInvestors(finalInvestors);

    try {
      await updateInvestor(removed.id, { 
        stage: destStage, 
        order: destination.index 
      });

      const itemsToUpdate = sourceStage === destStage
        ? updatedSource.filter(inv => inv.id !== removed.id)
        : [...updatedSource, ...updatedDest].filter(inv => inv.id !== removed.id);

      await Promise.all(
        itemsToUpdate.map(inv => updateInvestor(inv.id, { order: inv.order }))
      );
    } catch (error) {
      console.error('Error updating order:', error);
      fetchInvestors();
    }
  };

  const getInvestorsByStage = (stage: Investor['stage']) => {
    return investors
      .filter(inv => inv.stage === stage)
      .sort((a, b) => a.order - b.order);
  };

  const stages: { id: Investor['stage']; title: string; color: string }[] = [
    { id: 'research', title: 'Research', color: '#6366f1' },
    { id: 'outreach', title: 'Outreach', color: '#8b5cf6' },
    { id: 'meeting', title: 'Meeting', color: '#3b82f6' },
    { id: 'follow_up', title: 'Follow-up', color: '#14b8a6' },
    { id: 'committed', title: 'Committed', color: '#10b981' },
    { id: 'passed', title: 'Passed', color: '#ef4444' },
  ];

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="investors" />
      
      <main style={{
        paddingTop: isMobile ? "64px" : "136px",
        paddingBottom: isMobile ? "88px" : "32px",
        paddingLeft: isMobile ? "12px" : "24px",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
        maxWidth: "1600px",
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
            <TrendingUp size={isMobile ? 32 : 40} style={{ color: "#3b82f6" }} />
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
                Fundraising pipeline management
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
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
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
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Plus size={16} />
            Add Investor
          </button>
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
              maxWidth: "700px",
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
                  Add Investor
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewInvestor({
                      name: '',
                      firm: '',
                      email: '',
                      phone: '',
                      linkedin: '',
                      focus: { stage: '', sector: '', checkSize: '' },
                      notes: '',
                    });
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

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    color: "#cbd5e1", 
                    fontSize: "13px",
                    marginBottom: "6px",
                    fontWeight: "500",
                  }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newInvestor.name}
                    onChange={(e) => setNewInvestor({ ...newInvestor, name: e.target.value })}
                    placeholder="Investor name"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
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
                    Firm / Organization
                  </label>
                  <input
                    type="text"
                    value={newInvestor.firm}
                    onChange={(e) => setNewInvestor({ ...newInvestor, firm: e.target.value })}
                    placeholder="Company name"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
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
                    Email
                  </label>
                  <input
                    type="email"
                    value={newInvestor.email}
                    onChange={(e) => setNewInvestor({ ...newInvestor, email: e.target.value })}
                    placeholder="email@example.com"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
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
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newInvestor.phone}
                    onChange={(e) => setNewInvestor({ ...newInvestor, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <label style={{ 
                  display: "block", 
                  color: "#cbd5e1", 
                  fontSize: "13px",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}>
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={newInvestor.linkedin}
                  onChange={(e) => setNewInvestor({ ...newInvestor, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ marginTop: "16px" }}>
                <label style={{ 
                  display: "block", 
                  color: "#cbd5e1", 
                  fontSize: "13px",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}>
                  Investment Focus
                </label>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "12px" }}>
                  <input
                    type="text"
                    value={newInvestor.focus.stage}
                    onChange={(e) => setNewInvestor({ 
                      ...newInvestor, 
                      focus: { ...newInvestor.focus, stage: e.target.value }
                    })}
                    placeholder="Stage (e.g., Seed, Series A)"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                  <input
                    type="text"
                    value={newInvestor.focus.sector}
                    onChange={(e) => setNewInvestor({ 
                      ...newInvestor, 
                      focus: { ...newInvestor.focus, sector: e.target.value }
                    })}
                    placeholder="Sector (e.g., SaaS, AI)"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                  <input
                    type="text"
                    value={newInvestor.focus.checkSize}
                    onChange={(e) => setNewInvestor({ 
                      ...newInvestor, 
                      focus: { ...newInvestor.focus, checkSize: e.target.value }
                    })}
                    placeholder="Check Size (e.g., $500K)"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "13px",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
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
                  value={newInvestor.notes}
                  onChange={(e) => setNewInvestor({ ...newInvestor, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewInvestor({
                      name: '',
                      firm: '',
                      email: '',
                      phone: '',
                      linkedin: '',
                      focus: { stage: '', sector: '', checkSize: '' },
                      notes: '',
                    });
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
                  onClick={createInvestor}
                  disabled={!newInvestor.name.trim()}
                  style={{
                    padding: "10px 20px",
                    background: newInvestor.name.trim() 
                      ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                      : "rgba(148, 163, 184, 0.1)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: newInvestor.name.trim() ? "pointer" : "not-allowed",
                    opacity: newInvestor.name.trim() ? 1 : 0.5,
                  }}
                >
                  Add Investor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Board */}
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
              borderTop: "3px solid #3b82f6",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }} />
            Loading investors...
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
              gap: isMobile ? "16px" : "16px",
              overflowX: isMobile ? "visible" : "auto",
            }}>
              {stages.map(stage => (
                <div key={stage.id} style={{
                  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)",
                  borderRadius: "12px",
                  border: `1px solid ${stage.color}33`,
                  padding: isMobile ? "12px" : "14px",
                  minHeight: isMobile ? "auto" : "350px",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    paddingBottom: "10px",
                    borderBottom: `2px solid ${stage.color}33`,
                  }}>
                    <h3 style={{
                      fontSize: isMobile ? "12px" : "13px",
                      fontWeight: "700",
                      color: stage.color,
                      margin: 0,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}>
                      {stage.title}
                    </h3>
                    <span style={{
                      background: `${stage.color}22`,
                      color: stage.color,
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: "600",
                    }}>
                      {getInvestorsByStage(stage.id).length}
                    </span>
                  </div>

                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight: "80px",
                          background: snapshot.isDraggingOver 
                            ? `${stage.color}11` 
                            : "transparent",
                          borderRadius: "8px",
                          padding: "4px",
                          transition: "background 0.2s",
                        }}
                      >
                        {getInvestorsByStage(stage.id).map((investor, index) => (
                          <Draggable
                            key={investor.id}
                            draggableId={investor.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  background: snapshot.isDragging
                                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%)"
                                    : "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
                                  border: snapshot.isDragging
                                    ? "1px solid rgba(59, 130, 246, 0.5)"
                                    : "1px solid rgba(148, 163, 184, 0.1)",
                                  borderRadius: "8px",
                                  padding: isMobile ? "10px" : "12px",
                                  marginBottom: "8px",
                                  cursor: "grab",
                                  transition: "all 0.2s",
                                }}
                                onClick={() => setViewingInvestor(investor)}
                              >
                                <div style={{ 
                                  display: "flex", 
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  marginBottom: "6px",
                                }}>
                                  <div style={{ flex: 1 }}>
                                    <h4 style={{
                                      fontSize: isMobile ? "13px" : "14px",
                                      fontWeight: "600",
                                      color: "white",
                                      margin: "0 0 2px 0",
                                      lineHeight: "1.3",
                                    }}>
                                      {investor.name}
                                    </h4>
                                    {investor.firm && (
                                      <p style={{
                                        fontSize: "11px",
                                        color: "#94a3b8",
                                        margin: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}>
                                        <Building2 size={10} />
                                        {investor.firm}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteInvestor(investor.id);
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#ef4444",
                                      cursor: "pointer",
                                      padding: "2px",
                                      opacity: 0.6,
                                      transition: "opacity 0.2s",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                {investor.focus.stage && (
                                  <div style={{ 
                                    fontSize: "10px",
                                    color: "#60a5fa",
                                    background: "rgba(59, 130, 246, 0.15)",
                                    padding: "3px 6px",
                                    borderRadius: "4px",
                                    display: "inline-block",
                                    marginTop: "4px",
                                  }}>
                                    {investor.focus.stage}
                                    {investor.focus.sector && ` • ${investor.focus.sector}`}
                                  </div>
                                )}

                                <div style={{ 
                                  display: "flex", 
                                  gap: "6px",
                                  marginTop: "8px",
                                  flexWrap: "wrap",
                                }}>
                                  {investor.email && (
                                    <a
                                      href={`mailto:${investor.email}`}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        color: "#94a3b8",
                                        transition: "color 0.2s",
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.color = "#cbd5e1"}
                                      onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                                    >
                                      <Mail size={12} />
                                    </a>
                                  )}
                                  {investor.phone && (
                                    <a
                                      href={`tel:${investor.phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        color: "#94a3b8",
                                        transition: "color 0.2s",
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.color = "#cbd5e1"}
                                      onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                                    >
                                      <Phone size={12} />
                                    </a>
                                  )}
                                  {investor.linkedin && (
                                    <a
                                      href={investor.linkedin}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        color: "#94a3b8",
                                        transition: "color 0.2s",
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.color = "#cbd5e1"}
                                      onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                                    >
                                      <Linkedin size={12} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}

        {/* Detail View Modal */}
        {viewingInvestor && (
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
          }}
          onClick={() => setViewingInvestor(null)}
          >
            <div 
              style={{
                background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)",
                borderRadius: "16px",
                padding: isMobile ? "20px" : "32px",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                border: "1px solid rgba(148, 163, 184, 0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "flex-start",
                marginBottom: "20px",
              }}>
                <div>
                  <h2 style={{ 
                    fontSize: isMobile ? "20px" : "24px", 
                    fontWeight: "bold", 
                    color: "white",
                    margin: "0 0 4px 0",
                  }}>
                    {viewingInvestor.name}
                  </h2>
                  {viewingInvestor.firm && (
                    <p style={{ 
                      fontSize: "14px", 
                      color: "#94a3b8",
                      margin: 0,
                    }}>
                      {viewingInvestor.firm}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setViewingInvestor(null)}
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
                <h3 style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                  Contact
                </h3>
                {viewingInvestor.email && (
                  <a href={`mailto:${viewingInvestor.email}`} style={{ display: "block", color: "#60a5fa", fontSize: "14px", marginBottom: "4px", textDecoration: "none" }}>
                    <Mail size={14} style={{ display: "inline", marginRight: "6px" }} />
                    {viewingInvestor.email}
                  </a>
                )}
                {viewingInvestor.phone && (
                  <a href={`tel:${viewingInvestor.phone}`} style={{ display: "block", color: "#60a5fa", fontSize: "14px", marginBottom: "4px", textDecoration: "none" }}>
                    <Phone size={14} style={{ display: "inline", marginRight: "6px" }} />
                    {viewingInvestor.phone}
                  </a>
                )}
                {viewingInvestor.linkedin && (
                  <a href={viewingInvestor.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "block", color: "#60a5fa", fontSize: "14px", textDecoration: "none" }}>
                    <Linkedin size={14} style={{ display: "inline", marginRight: "6px" }} />
                    LinkedIn Profile
                  </a>
                )}
              </div>

              {(viewingInvestor.focus.stage || viewingInvestor.focus.sector || viewingInvestor.focus.checkSize) && (
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                    Investment Focus
                  </h3>
                  <div style={{ fontSize: "14px", color: "#cbd5e1" }}>
                    {viewingInvestor.focus.stage && <div>Stage: {viewingInvestor.focus.stage}</div>}
                    {viewingInvestor.focus.sector && <div>Sector: {viewingInvestor.focus.sector}</div>}
                    {viewingInvestor.focus.checkSize && <div>Check Size: {viewingInvestor.focus.checkSize}</div>}
                  </div>
                </div>
              )}

              {viewingInvestor.notes && (
                <div style={{ marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
                    Notes
                  </h3>
                  <p style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {viewingInvestor.notes}
                  </p>
                </div>
              )}
            </div>
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
