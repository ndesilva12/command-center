"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, RotateCcw, ExternalLink, Check, X, Edit2 } from "lucide-react";

interface QuickLink {
  id: string;
  name: string;
  url: string;
  icon?: string;
}

const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: "spotify", name: "Spotify", url: "https://open.spotify.com", icon: "🎵" },
  { id: "claude", name: "Claude", url: "https://claude.ai", icon: "🤖" },
  { id: "grok", name: "Grok", url: "https://grok.com", icon: "⚡" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com", icon: "✨" },
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com", icon: "💬" },
];

const STORAGE_KEY = "cc-quick-links";

const EMOJI_SUGGESTIONS = ["🔗", "🌐", "📱", "💻", "🎮", "📧", "📝", "🎵", "🎬", "📚", "💼", "🛒", "🏠", "⭐", "🔥", "💡", "🚀", "🎯", "💬", "🤖", "✨", "⚡"];

export function QuickLinksSettings() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", url: "", icon: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ name: "", url: "", icon: "🔗" });
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLinks(JSON.parse(saved));
      } catch (e) {
        setLinks(DEFAULT_QUICK_LINKS);
      }
    } else {
      setLinks(DEFAULT_QUICK_LINKS);
    }
    setLoaded(true);
  }, []);

  const saveLinks = (newLinks: QuickLink[]) => {
    setLinks(newLinks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks));
  };

  const handleAdd = () => {
    if (!newLink.name.trim() || !newLink.url.trim()) return;
    
    let url = newLink.url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const link: QuickLink = {
      id: `link-${Date.now()}`,
      name: newLink.name.trim(),
      url,
      icon: newLink.icon || "🔗",
    };
    
    saveLinks([...links, link]);
    setNewLink({ name: "", url: "", icon: "🔗" });
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    saveLinks(links.filter(l => l.id !== id));
  };

  const startEdit = (link: QuickLink) => {
    setEditingId(link.id);
    setEditForm({ name: link.name, url: link.url, icon: link.icon || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", url: "", icon: "" });
  };

  const saveEdit = () => {
    if (!editForm.name.trim() || !editForm.url.trim()) return;
    
    let url = editForm.url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    saveLinks(links.map(l => 
      l.id === editingId 
        ? { ...l, name: editForm.name.trim(), url, icon: editForm.icon || "🔗" }
        : l
    ));
    cancelEdit();
  };

  const handleReset = () => {
    if (confirm("Reset quick links to defaults? This will remove any custom links.")) {
      saveLinks(DEFAULT_QUICK_LINKS);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== id) {
      const draggedIndex = links.findIndex(l => l.id === draggedId);
      const targetIndex = links.findIndex(l => l.id === id);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newLinks = [...links];
        const [removed] = newLinks.splice(draggedIndex, 1);
        newLinks.splice(targetIndex, 0, removed);
        setLinks(newLinks);
      }
    }
  };

  const handleDragEnd = () => {
    if (draggedId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    }
    setDraggedId(null);
  };

  if (!loaded) return null;

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
      }}>
        <div>
          <h2 style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "var(--foreground)",
            marginBottom: "4px",
          }}>
            Quick Links
          </h2>
          <p style={{ fontSize: "14px", color: "var(--muted)" }}>
            Customize your homepage shortcuts
          </p>
        </div>
        <button
          onClick={handleReset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "transparent",
            color: "var(--muted)",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          <RotateCcw style={{ width: "14px", height: "14px" }} />
          Reset
        </button>
      </div>

      {/* Links List */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "16px",
      }}>
        {links.map((link) => (
          <div
            key={link.id}
            draggable={editingId !== link.id}
            onDragStart={(e) => handleDragStart(e, link.id)}
            onDragOver={(e) => handleDragOver(e, link.id)}
            onDragEnd={handleDragEnd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: draggedId === link.id
                ? "rgba(0, 170, 255, 0.1)"
                : "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${draggedId === link.id ? "rgba(0, 170, 255, 0.3)" : "rgba(255, 255, 255, 0.06)"}`,
              transition: "all 0.2s",
              cursor: editingId === link.id ? "default" : "grab",
            }}
          >
            {editingId !== link.id && (
              <GripVertical style={{
                width: "16px",
                height: "16px",
                color: "rgba(255, 255, 255, 0.3)",
                flexShrink: 0,
              }} />
            )}

            {editingId === link.id ? (
              /* Edit Mode */
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={editForm.icon}
                    onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                    placeholder="🔗"
                    style={{
                      width: "48px",
                      padding: "8px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "var(--foreground)",
                      fontSize: "18px",
                      textAlign: "center",
                    }}
                  />
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Name"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      background: "rgba(0, 0, 0, 0.3)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={editForm.url}
                  onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                  placeholder="https://example.com"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                  }}
                />
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      background: "transparent",
                      color: "var(--muted)",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <X style={{ width: "14px", height: "14px" }} />
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#00aaff",
                      color: "white",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Check style={{ width: "14px", height: "14px" }} />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <>
                <span style={{ fontSize: "20px", flexShrink: 0 }}>{link.icon || "🔗"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--foreground)",
                    marginBottom: "2px",
                  }}>
                    {link.name}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: "var(--muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {link.url}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      background: "transparent",
                      color: "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.color = "#00aaff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--muted)";
                    }}
                  >
                    <ExternalLink style={{ width: "14px", height: "14px" }} />
                  </a>
                  <button
                    onClick={() => startEdit(link)}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: "none",
                      background: "transparent",
                      color: "var(--muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.color = "var(--foreground)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--muted)";
                    }}
                  >
                    <Edit2 style={{ width: "14px", height: "14px" }} />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: "none",
                      background: "transparent",
                      color: "var(--muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                      e.currentTarget.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--muted)";
                    }}
                  >
                    <Trash2 style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add New Link */}
      {showAddForm ? (
        <div style={{
          padding: "16px",
          borderRadius: "12px",
          background: "rgba(0, 170, 255, 0.05)",
          border: "1px solid rgba(0, 170, 255, 0.2)",
        }}>
          <div style={{ marginBottom: "12px", fontWeight: 500, color: "var(--foreground)" }}>
            Add New Link
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={newLink.icon}
                onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                placeholder="🔗"
                style={{
                  width: "48px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "var(--foreground)",
                  fontSize: "18px",
                  textAlign: "center",
                }}
              />
              <input
                type="text"
                value={newLink.name}
                onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                placeholder="Link Name"
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(0, 0, 0, 0.3)",
                  color: "var(--foreground)",
                  fontSize: "14px",
                }}
              />
            </div>
            <input
              type="text"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://example.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(0, 0, 0, 0.3)",
                color: "var(--foreground)",
                fontSize: "14px",
              }}
            />
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              padding: "8px 0",
            }}>
              {EMOJI_SUGGESTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewLink({ ...newLink, icon: emoji })}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    border: newLink.icon === emoji ? "2px solid #00aaff" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: newLink.icon === emoji ? "rgba(0, 170, 255, 0.1)" : "transparent",
                    fontSize: "16px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewLink({ name: "", url: "", icon: "🔗" });
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "transparent",
                  color: "var(--muted)",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newLink.name.trim() || !newLink.url.trim()}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: (!newLink.name.trim() || !newLink.url.trim()) ? "rgba(0, 170, 255, 0.3)" : "#00aaff",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: (!newLink.name.trim() || !newLink.url.trim()) ? "not-allowed" : "pointer",
                }}
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "2px dashed rgba(255, 255, 255, 0.1)",
            background: "transparent",
            color: "var(--muted)",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
            e.currentTarget.style.color = "#00aaff";
            e.currentTarget.style.background = "rgba(0, 170, 255, 0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Plus style={{ width: "18px", height: "18px" }} />
          Add New Link
        </button>
      )}
    </div>
  );
}
