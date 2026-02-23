"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Search, Trash2, Edit2, Save, X, Tag, Folder, Calendar, Clock, Download } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ToolBackground } from "@/components/tools/ToolBackground";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  createdAt: number;
  updatedAt: number;
}

export default function NotesPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('notes', 'Notes', '#10b981');
  
  const [isMobile, setIsMobile] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);
  
  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editFolder, setEditFolder] = useState("inbox");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [selectedFolder]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFolder !== 'all') params.set('folder', selectedFolder);
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/notes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchNotes();
  };

  const handleNewNote = () => {
    setEditTitle("");
    setEditContent("");
    setEditTags("");
    setEditFolder("inbox");
    setShowNewNote(true);
    setIsEditing(false);
    setSelectedNote(null);
  };

  const handleSaveNew = async () => {
    if (!editTitle.trim()) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          tags: editTags.split(',').map(t => t.trim()).filter(t => t),
          folder: editFolder,
        }),
      });

      if (res.ok) {
        setShowNewNote(false);
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setEditFolder(note.folder);
    setIsEditing(true);
    setShowNewNote(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedNote || !editTitle.trim()) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedNote.id,
          title: editTitle,
          content: editContent,
          tags: editTags.split(',').map(t => t.trim()).filter(t => t),
          folder: editFolder,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      const res = await fetch(`/api/notes?id=${noteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
        }
        fetchNotes();
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/notes/export');
      if (!res.ok) {
        alert('Failed to export notes');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `command-center-notes-${timestamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export notes:', error);
      alert('Failed to export notes');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const folders = ['all', 'inbox', 'projects', 'ideas', 'daily', 'archive'];

  return (
    <ProtectedRoute>
      <TopNav />
      <BottomNav />
      <Sidebar />
      <ToolBackground color={toolCustom.color} />

      <main style={{
        paddingTop: isMobile ? "72px" : "24px",
        paddingBottom: isMobile ? "88px" : "32px",
        paddingLeft: isMobile ? "12px" : "calc(var(--sidebar-width, 240px) + 24px)",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: "100vh",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText style={{ width: "24px", height: "24px", color: toolCustom.color }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              Notes
            </h1>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handleExport}
              disabled={notes.length === 0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "8px",
                background: notes.length > 0 ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: notes.length > 0 ? "var(--foreground-muted)" : "#64748b",
                fontSize: "14px",
                fontWeight: 600,
                cursor: notes.length > 0 ? "pointer" : "not-allowed",
                opacity: notes.length > 0 ? 1 : 0.5,
              }}
            >
              <Download size={16} />
              Export
            </button>
            
            <button
              onClick={handleNewNote}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "8px",
                background: `linear-gradient(135deg, ${toolCustom.color}, ${toolCustom.color}dd)`,
                border: "none",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              New Note
            </button>
          </div>
        </div>

        {/* Search + Folder Filter */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px", position: "relative" }}>
            <Search size={18} style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
            }} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                width: "100%",
                padding: "10px 14px 10px 44px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: selectedFolder === folder 
                    ? `rgba(16, 185, 129, 0.15)` 
                    : "rgba(255, 255, 255, 0.05)",
                  color: selectedFolder === folder ? toolCustom.color : "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {folder}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "350px 1fr",
          gap: "16px",
          minHeight: "400px",
        }}>
          {/* Notes List */}
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "16px",
            maxHeight: "calc(100vh - 280px)",
            overflowY: "auto",
          }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                Loading...
              </div>
            ) : notes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                No notes found
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => handleEditNote(note)}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      background: selectedNote?.id === note.id 
                        ? "rgba(16, 185, 129, 0.1)" 
                        : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${selectedNote?.id === note.id 
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : 'rgba(255, 255, 255, 0.1)'}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedNote?.id !== note.id) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedNote?.id !== note.id) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                      }
                    }}
                  >
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      marginBottom: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {note.title}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#64748b",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={10} />
                        {formatDate(note.updatedAt)}
                      </span>
                      {note.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Tag size={10} />
                            {note.tags.length}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Note Editor/Viewer */}
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}>
            {(showNewNote || isEditing) ? (
              <>
                {/* Title Input */}
                <input
                  type="text"
                  placeholder="Note title..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: 600,
                    outline: "none",
                  }}
                />

                {/* Content Textarea */}
                <textarea
                  placeholder="Note content (markdown supported)..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "300px",
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "monospace",
                  }}
                />

                {/* Metadata */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 200px" }}>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="tag1, tag2, tag3"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>
                      Folder
                    </label>
                    <select
                      value={editFolder}
                      onChange={(e) => setEditFolder(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "13px",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {folders.filter(f => f !== 'all').map(folder => (
                        <option key={folder} value={folder}>
                          {folder.charAt(0).toUpperCase() + folder.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
                  <button
                    onClick={showNewNote ? handleSaveNew : handleSaveEdit}
                    disabled={!editTitle.trim()}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: editTitle.trim() 
                        ? `linear-gradient(135deg, ${toolCustom.color}, ${toolCustom.color}dd)` 
                        : "rgba(255, 255, 255, 0.1)",
                      border: "none",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: editTitle.trim() ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Save size={16} />
                    Save
                  </button>

                  {isEditing && (
                    <button
                      onClick={() => handleDeleteNote(selectedNote!.id)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "8px",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#ef4444",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowNewNote(false);
                      setIsEditing(false);
                      setSelectedNote(null);
                    }}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "var(--foreground-muted)",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#64748b",
                fontSize: "14px",
              }}>
                Select a note to view or create a new one
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
