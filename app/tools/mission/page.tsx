"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Target, Plus, Trash2, ExternalLink, Edit2, X } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  links: string[];
  status: 'created' | 'in_progress' | 'completed';
  order: number;
  created_at: number;
  updated_at: number;
}

export default function MissionPage() {
  return (
    <ProtectedRoute>
      <MissionContent />
    </ProtectedRoute>
  );
}

function MissionContent() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [newMission, setNewMission] = useState({ title: '', description: '', links: [''] });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const response = await fetch('/api/mission');
      const data = await response.json();
      setMissions(data.items || []);
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMission = async () => {
    if (!newMission.title.trim()) return;

    try {
      const response = await fetch('/api/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMission.title,
          description: newMission.description,
          links: newMission.links.filter(link => link.trim()),
        }),
      });

      if (response.ok) {
        const created = await response.json();
        setMissions([...missions, created]);
        setNewMission({ title: '', description: '', links: [''] });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error creating mission:', error);
    }
  };

  const updateMission = async (id: string, updates: Partial<Mission>) => {
    try {
      const response = await fetch(`/api/mission/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setMissions(missions.map(m => 
          m.id === id ? { ...m, ...updates } : m
        ));
      }
    } catch (error) {
      console.error('Error updating mission:', error);
    }
  };

  const deleteMission = async (id: string) => {
    if (!confirm('Delete this mission?')) return;

    try {
      const response = await fetch(`/api/mission/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMissions(missions.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error('Error deleting mission:', error);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside
    if (!destination) return;

    // Same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const mission = missions.find(m => m.id === draggableId);
    if (!mission) return;

    // Get missions in source and destination columns
    const sourceStatus = source.droppableId as Mission['status'];
    const destStatus = destination.droppableId as Mission['status'];

    // Create new missions array
    const newMissions = Array.from(missions);
    const sourceMissions = newMissions.filter(m => m.status === sourceStatus);
    const destMissions = sourceStatus === destStatus 
      ? sourceMissions 
      : newMissions.filter(m => m.status === destStatus);

    // Remove from source
    const [removed] = sourceMissions.splice(source.index, 1);
    
    // Update status if changed
    if (sourceStatus !== destStatus) {
      removed.status = destStatus;
    }

    // Insert at destination
    if (sourceStatus === destStatus) {
      sourceMissions.splice(destination.index, 0, removed);
    } else {
      destMissions.splice(destination.index, 0, removed);
    }

    // Update orders
    const updateOrders = (items: Mission[]) => {
      return items.map((m, idx) => ({ ...m, order: idx }));
    };

    const updatedSource = updateOrders(sourceMissions);
    const updatedDest = sourceStatus === destStatus ? updatedSource : updateOrders(destMissions);

    // Merge back
    const finalMissions = newMissions.map(m => {
      const updated = [...updatedSource, ...updatedDest].find(um => um.id === m.id);
      return updated || m;
    });

    setMissions(finalMissions);

    // Save to backend
    try {
      await updateMission(removed.id, { 
        status: destStatus, 
        order: destination.index 
      });

      // Update other items' orders in the affected columns
      const itemsToUpdate = sourceStatus === destStatus
        ? updatedSource.filter(m => m.id !== removed.id)
        : [...updatedSource, ...updatedDest].filter(m => m.id !== removed.id);

      await Promise.all(
        itemsToUpdate.map(m => updateMission(m.id, { order: m.order }))
      );
    } catch (error) {
      console.error('Error updating order:', error);
      fetchMissions(); // Revert on error
    }
  };

  const getMissionsByStatus = (status: Mission['status']) => {
    return missions
      .filter(m => m.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const columns: { id: Mission['status']; title: string; color: string }[] = [
    { id: 'created', title: 'Created', color: '#3b82f6' },
    { id: 'in_progress', title: 'In Progress', color: '#6366f1' },
    { id: 'completed', title: 'Completed', color: '#10b981' },
  ];

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="mission" />
      
      <main style={{
        paddingTop: isMobile ? "64px" : "136px",
        paddingBottom: isMobile ? "88px" : "32px",
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
            <Target size={isMobile ? 32 : 40} style={{ color: "#6366f1" }} />
            <div>
              <h1 style={{
                fontSize: isMobile ? "24px" : "32px",
                fontWeight: "bold",
                color: "white",
                margin: 0,
              }}>
                Mission
              </h1>
              <p style={{ 
                fontSize: isMobile ? "12px" : "14px", 
                color: "#94a3b8", 
                margin: 0 
              }}>
                Task and mission management
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
              background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
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
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Plus size={16} />
            New Mission
          </button>
        </div>

        {/* Add/Edit Form Modal */}
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
                marginBottom: "20px",
              }}>
                <h2 style={{ 
                  fontSize: isMobile ? "20px" : "24px", 
                  fontWeight: "bold", 
                  color: "white",
                  margin: 0,
                }}>
                  New Mission
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewMission({ title: '', description: '', links: [''] });
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
                  fontSize: "14px",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newMission.title}
                  onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                  placeholder="Mission title..."
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

              <div style={{ marginBottom: "16px" }}>
                <label style={{ 
                  display: "block", 
                  color: "#cbd5e1", 
                  fontSize: "14px",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}>
                  Description
                </label>
                <textarea
                  value={newMission.description}
                  onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                  placeholder="Optional description..."
                  rows={4}
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

              <div style={{ marginBottom: "24px" }}>
                <label style={{ 
                  display: "block", 
                  color: "#cbd5e1", 
                  fontSize: "14px",
                  marginBottom: "8px",
                  fontWeight: "500",
                }}>
                  Links
                </label>
                {newMission.links.map((link, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => {
                        const newLinks = [...newMission.links];
                        newLinks[idx] = e.target.value;
                        setNewMission({ ...newMission, links: newLinks });
                      }}
                      placeholder="https://..."
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        background: "rgba(15, 23, 42, 0.6)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: "13px",
                      }}
                    />
                    {idx === newMission.links.length - 1 && (
                      <button
                        onClick={() => setNewMission({ 
                          ...newMission, 
                          links: [...newMission.links, ''] 
                        })}
                        style={{
                          padding: "10px 16px",
                          background: "rgba(59, 130, 246, 0.2)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: "8px",
                          color: "#60a5fa",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewMission({ title: '', description: '', links: [''] });
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
                  onClick={createMission}
                  disabled={!newMission.title.trim()}
                  style={{
                    padding: "10px 20px",
                    background: newMission.title.trim() 
                      ? "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)"
                      : "rgba(148, 163, 184, 0.1)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: newMission.title.trim() ? "pointer" : "not-allowed",
                    opacity: newMission.title.trim() ? 1 : 0.5,
                  }}
                >
                  Create Mission
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board */}
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
              borderTop: "3px solid #6366f1",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite",
            }} />
            Loading missions...
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: isMobile ? "16px" : "20px",
            }}>
              {columns.map(column => (
                <div key={column.id} style={{
                  background: "linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)",
                  borderRadius: "12px",
                  border: `1px solid ${column.color}33`,
                  padding: isMobile ? "12px" : "16px",
                  minHeight: isMobile ? "auto" : "400px",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                    paddingBottom: "12px",
                    borderBottom: `2px solid ${column.color}33`,
                  }}>
                    <h3 style={{
                      fontSize: isMobile ? "14px" : "16px",
                      fontWeight: "700",
                      color: column.color,
                      margin: 0,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}>
                      {column.title}
                    </h3>
                    <span style={{
                      background: `${column.color}22`,
                      color: column.color,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}>
                      {getMissionsByStatus(column.id).length}
                    </span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight: "100px",
                          background: snapshot.isDraggingOver 
                            ? `${column.color}11` 
                            : "transparent",
                          borderRadius: "8px",
                          padding: "4px",
                          transition: "background 0.2s",
                        }}
                      >
                        {getMissionsByStatus(column.id).map((mission, index) => (
                          <Draggable
                            key={mission.id}
                            draggableId={mission.id}
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
                                  padding: isMobile ? "12px" : "14px",
                                  marginBottom: "8px",
                                  cursor: "grab",
                                  transition: "all 0.2s",
                                }}
                              >
                                <div style={{ 
                                  display: "flex", 
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  marginBottom: mission.description ? "8px" : 0,
                                }}>
                                  <h4 style={{
                                    fontSize: isMobile ? "14px" : "15px",
                                    fontWeight: "600",
                                    color: "white",
                                    margin: 0,
                                    flex: 1,
                                    lineHeight: "1.4",
                                  }}>
                                    {mission.title}
                                  </h4>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteMission(mission.id);
                                    }}
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

                                {mission.description && (
                                  <p style={{
                                    fontSize: "13px",
                                    color: "#94a3b8",
                                    margin: "0 0 8px 0",
                                    lineHeight: "1.5",
                                  }}>
                                    {mission.description}
                                  </p>
                                )}

                                {mission.links.length > 0 && (
                                  <div style={{ 
                                    display: "flex", 
                                    flexWrap: "wrap", 
                                    gap: "6px",
                                    marginTop: "8px",
                                  }}>
                                    {mission.links.map((link, idx) => (
                                      <a
                                        key={idx}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          padding: "4px 8px",
                                          background: "rgba(59, 130, 246, 0.15)",
                                          border: "1px solid rgba(59, 130, 246, 0.3)",
                                          borderRadius: "4px",
                                          color: "#60a5fa",
                                          fontSize: "11px",
                                          textDecoration: "none",
                                          transition: "all 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = "rgba(59, 130, 246, 0.25)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                                        }}
                                      >
                                        <ExternalLink size={10} />
                                        Link {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}
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
      </main>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
