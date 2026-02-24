"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Plus, Search, Trash2, Save, X, Tag, Folder, Clock, Download, ChevronRight, MoreHorizontal, Star, Archive, PenLine, Eye } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  createdAt: number;
  updatedAt: number;
  starred?: boolean;
}

const FOLDERS = ['inbox', 'projects', 'ideas', 'daily', 'archive'];

export default function NotesPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('notes', 'Notes', '#10b981');
  
  const [isMobile, setIsMobile] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editFolder, setEditFolder] = useState("inbox");
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [selectedFolder]);

  // Clear messages after 3s
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedFolder !== 'all') params.set('folder', selectedFolder);
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/notes?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      } else if (res.status === 401) {
        setError("Please sign in to access notes");
        setNotes([]);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load notes");
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      setError("Network error - check connection");
    } finally {
      setLoading(false);
    }
  };

  const handleNewNote = () => {
    setEditTitle("Untitled");
    setEditContent("");
    setEditTags("");
    setEditFolder("inbox");
    setSelectedNote(null);
    setIsEditing(true);
    setViewMode("edit");
    // Focus title after render
    setTimeout(() => {
      const titleInput = document.querySelector('input[placeholder="Note title..."]') as HTMLInputElement;
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }
    }, 100);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isNew = !selectedNote;
      const method = isNew ? 'POST' : 'PUT';
      const body = {
        ...(selectedNote ? { id: selectedNote.id } : {}),
        title: editTitle.trim(),
        content: editContent,
        tags: editTags.split(',').map(t => t.trim()).filter(t => t),
        folder: editFolder,
      };

      const res = await fetch('/api/notes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(isNew ? "Note created" : "Note saved");
        await fetchNotes();
        
        // Update selected note with new data
        if (isNew && data.id) {
          setSelectedNote({ ...body, id: data.id, createdAt: data.createdAt || Date.now(), updatedAt: data.updatedAt || Date.now() } as Note);
        }
      } else if (res.status === 401) {
        setError("Please sign in to save notes");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save note");
      }
    } catch (err) {
      console.error('Failed to save note:', err);
      setError("Network error - check connection");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setEditFolder(note.folder);
    setIsEditing(true);
    setViewMode("edit");
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note permanently?')) return;

    try {
      const res = await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg("Note deleted");
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
          setIsEditing(false);
        }
        fetchNotes();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
      setError("Network error");
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/notes/export');
      if (!res.ok) {
        setError("Failed to export notes");
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
      setSuccessMsg("Notes exported");
    } catch (err) {
      console.error('Failed to export notes:', err);
      setError("Export failed");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        handleSave();
      }
      // Cmd/Ctrl + N for new note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewNote();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editTitle, editContent]);

  return (
    <>
      <TopNav />
      <BottomNav />
      <Sidebar />
      <ToolBackground color={toolCustom.color} />

      <main style={{
        paddingTop: isMobile ? "64px" : "68px",
        paddingBottom: isMobile ? "80px" : "16px",
        paddingLeft: isMobile ? "0" : "calc(var(--sidebar-width, 240px) + 8px)",
        paddingRight: isMobile ? "0" : "8px",
        minHeight: "100vh",
      }}>
        {/* Messages */}
        {(error || successMsg) && (
          <div style={{
            position: "fixed",
            top: "90px",
            right: "24px",
            zIndex: 1000,
            padding: "12px 20px",
            borderRadius: "8px",
            background: error ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
            border: `1px solid ${error ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
            color: error ? "#ef4444" : "#22c55e",
            fontSize: "14px",
            fontWeight: 500,
          }}>
            {error || successMsg}
          </div>
        )}

        <div style={{ 
          display: "flex", 
          height: isMobile ? "calc(100vh - 144px)" : "calc(100vh - 84px)",
          gap: "0",
        }}>
          {/* Left Sidebar: Notes List */}
          <div style={{
            width: isMobile ? "100%" : "320px",
            minWidth: isMobile ? "100%" : "320px",
            display: isEditing && isMobile ? "none" : "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.02)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
          }}>
            {/* Header */}
            <div style={{
              padding: "20px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FileText size={24} style={{ color: toolCustom.color }} />
                  <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Notes</h1>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleExport}
                    disabled={notes.length === 0}
                    title="Export all notes"
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--foreground-muted)",
                      cursor: notes.length > 0 ? "pointer" : "not-allowed",
                      opacity: notes.length > 0 ? 1 : 0.5,
                    }}
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={handleNewNote}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      background: toolCustom.color,
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Plus size={16} />
                    New
                  </button>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <Search size={16} style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--foreground-muted)",
                }} />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchNotes()}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Folder Tabs */}
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setSelectedFolder("all")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: selectedFolder === "all" ? `${toolCustom.color}20` : "transparent",
                    color: selectedFolder === "all" ? toolCustom.color : "var(--foreground-muted)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  All
                </button>
                {FOLDERS.map(folder => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: selectedFolder === folder ? `${toolCustom.color}20` : "transparent",
                      color: selectedFolder === folder ? toolCustom.color : "var(--foreground-muted)",
                      fontSize: "13px",
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

            {/* Notes List */}
            <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--foreground-muted)" }}>
                  Loading...
                </div>
              ) : notes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--foreground-muted)" }}>
                  <FileText size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
                  <p style={{ margin: 0 }}>No notes yet</p>
                  <button
                    onClick={handleNewNote}
                    style={{
                      marginTop: "16px",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      background: toolCustom.color,
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Create your first note
                  </button>
                </div>
              ) : (
                notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    style={{
                      padding: "14px 16px",
                      marginBottom: "4px",
                      borderRadius: "8px",
                      background: selectedNote?.id === note.id ? `${toolCustom.color}15` : "transparent",
                      border: selectedNote?.id === note.id ? `1px solid ${toolCustom.color}40` : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      marginBottom: "6px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {note.title}
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: "var(--foreground-muted)",
                      marginBottom: "6px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      opacity: 0.7,
                    }}>
                      {note.content.substring(0, 80) || "No content"}
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "var(--foreground-muted)",
                    }}>
                      <Clock size={12} />
                      <span>{formatDate(note.updatedAt)}</span>
                      {note.tags.length > 0 && (
                        <>
                          <span style={{ opacity: 0.5 }}>•</span>
                          <Tag size={12} />
                          <span>{note.tags.length}</span>
                        </>
                      )}
                      <span style={{ 
                        marginLeft: "auto",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.08)",
                        textTransform: "capitalize",
                      }}>
                        {note.folder}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Editor */}
          <div style={{
            flex: 1,
            display: isEditing || !isMobile ? "flex" : "none",
            flexDirection: "column",
            background: "rgba(0,0,0,0.2)",
            minWidth: 0,
          }}>
            {isEditing ? (
              <>
                {/* Editor Header */}
                <div style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}>
                  {isMobile && (
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{
                        padding: "8px",
                        borderRadius: "6px",
                        border: "none",
                        background: "transparent",
                        color: "var(--foreground-muted)",
                        cursor: "pointer",
                      }}
                    >
                      <ChevronRight size={20} style={{ transform: "rotate(180deg)" }} />
                    </button>
                  )}

                  <div style={{ flex: 1, display: "flex", gap: "12px", alignItems: "center" }}>
                    {/* Folder selector */}
                    <select
                      value={editFolder}
                      onChange={(e) => setEditFolder(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.05)",
                        color: "var(--foreground)",
                        fontSize: "13px",
                        outline: "none",
                      }}
                    >
                      {FOLDERS.map(folder => (
                        <option key={folder} value={folder}>
                          {folder.charAt(0).toUpperCase() + folder.slice(1)}
                        </option>
                      ))}
                    </select>

                    {/* Tags input */}
                    <div style={{ flex: 1, position: "relative" }}>
                      <Tag size={14} style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--foreground-muted)",
                      }} />
                      <input
                        type="text"
                        placeholder="Tags (comma-separated)"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px 8px 34px",
                          borderRadius: "6px",
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.05)",
                          color: "var(--foreground)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {/* View mode toggle */}
                    <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <button
                        onClick={() => setViewMode("edit")}
                        style={{
                          padding: "8px 12px",
                          border: "none",
                          background: viewMode === "edit" ? "rgba(255,255,255,0.1)" : "transparent",
                          color: viewMode === "edit" ? "var(--foreground)" : "var(--foreground-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                        }}
                      >
                        <PenLine size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => setViewMode("preview")}
                        style={{
                          padding: "8px 12px",
                          border: "none",
                          background: viewMode === "preview" ? "rgba(255,255,255,0.1)" : "transparent",
                          color: viewMode === "preview" ? "var(--foreground)" : "var(--foreground-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                        }}
                      >
                        <Eye size={14} />
                        Preview
                      </button>
                    </div>

                    {selectedNote && (
                      <button
                        onClick={() => handleDeleteNote(selectedNote.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <button
                      onClick={handleSave}
                      disabled={saving || !editTitle.trim()}
                      style={{
                        padding: "8px 20px",
                        borderRadius: "6px",
                        border: "none",
                        background: editTitle.trim() ? toolCustom.color : "rgba(255,255,255,0.1)",
                        color: "#fff",
                        cursor: editTitle.trim() ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "14px",
                        fontWeight: 600,
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      <Save size={16} />
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>

                {/* Title Input */}
                <div style={{ padding: "24px 48px 0" }}>
                  <input
                    type="text"
                    placeholder="Note title..."
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0",
                      border: "none",
                      background: "transparent",
                      color: "var(--foreground)",
                      fontSize: "32px",
                      fontWeight: 700,
                      outline: "none",
                      lineHeight: 1.3,
                    }}
                  />
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: "24px 48px 48px", overflow: "auto" }}>
                  {viewMode === "edit" ? (
                    <textarea
                      ref={contentRef}
                      placeholder="Start writing... (Markdown supported)

# Heading 1
## Heading 2

**Bold** or *italic*

- Bullet list
- Another item

1. Numbered list
2. Second item

> Blockquote

`inline code`

---

Write freely. Your notes are saved when you click Save or press Cmd/Ctrl+S."
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: "400px",
                        padding: "0",
                        border: "none",
                        background: "transparent",
                        color: "var(--foreground)",
                        fontSize: "16px",
                        lineHeight: 1.8,
                        outline: "none",
                        resize: "none",
                        fontFamily: "'SF Mono', Monaco, 'Cascadia Code', monospace",
                      }}
                    />
                  ) : (
                    <div 
                      style={{
                        fontSize: "16px",
                        lineHeight: 1.8,
                        color: "var(--foreground)",
                        whiteSpace: "pre-wrap",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: editContent
                          .replace(/^### (.*$)/gm, '<h3 style="font-size: 18px; font-weight: 600; margin: 24px 0 8px;">$1</h3>')
                          .replace(/^## (.*$)/gm, '<h2 style="font-size: 22px; font-weight: 600; margin: 32px 0 12px;">$1</h2>')
                          .replace(/^# (.*$)/gm, '<h1 style="font-size: 28px; font-weight: 700; margin: 32px 0 16px;">$1</h1>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">$1</code>')
                          .replace(/^> (.*$)/gm, '<blockquote style="border-left: 3px solid #888; padding-left: 16px; margin: 16px 0; opacity: 0.8;">$1</blockquote>')
                          .replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0;">')
                          .replace(/^- (.*$)/gm, '<li style="margin-left: 20px;">$1</li>')
                          .replace(/\n/g, '<br>')
                      }}
                    />
                  )}
                </div>

                {/* Footer info */}
                {selectedNote && (
                  <div style={{
                    padding: "12px 48px",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    fontSize: "12px",
                    color: "var(--foreground-muted)",
                    display: "flex",
                    gap: "10px",
                  }}>
                    <span>Created: {new Date(selectedNote.createdAt).toLocaleString()}</span>
                    <span>Updated: {new Date(selectedNote.updatedAt).toLocaleString()}</span>
                    <span style={{ marginLeft: "auto" }}>⌘S to save</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--foreground-muted)",
                flexDirection: "column",
                gap: "10px",
              }}>
                <FileText size={64} style={{ opacity: 0.2 }} />
                <p style={{ margin: 0, fontSize: "16px" }}>Select a note or create a new one</p>
                <button
                  onClick={handleNewNote}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "8px",
                    border: "none",
                    background: toolCustom.color,
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Plus size={18} />
                  New Note
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
