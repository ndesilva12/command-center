"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, ExternalLink, Trash2, Save, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [showNewNote, setShowNewNote] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const userId = "norman";
      const notesRef = collection(db, "users", userId, "notes");
      const snapshot = await getDocs(notesRef);
      const loadedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Note));
      setNotes(loadedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedTitle.trim() || !editedContent.trim()) return;

    try {
      const userId = "norman";
      const noteId = selectedNote?.id || `note_${Date.now()}`;
      const noteData = {
        title: editedTitle,
        content: editedContent,
        createdAt: selectedNote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", userId, "notes", noteId), noteData);
      
      if (selectedNote) {
        setNotes(prev => prev.map(n => n.id === noteId ? { ...noteData, id: noteId } : n));
      } else {
        setNotes(prev => [{ ...noteData, id: noteId }, ...prev]);
      }
      
      setShowNewNote(false);
      setSelectedNote(null);
      setEditedTitle("");
      setEditedContent("");
    } catch (err) {
      console.error("Failed to save note:", err);
      alert("Failed to save note");
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;

    try {
      const userId = "norman";
      await deleteDoc(doc(db, "users", userId, "notes", noteId));
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
      alert("Failed to delete note");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "80px 20px 20px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <FileText size={48} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "var(--foreground)", margin: 0 }}>Notes</h1>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => window.open('https://notion.so', '_blank')}
              style={{
                padding: "10px 20px",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "8px",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ExternalLink size={16} />
              Open Notion
            </button>
            
            <button
              onClick={() => {
                setShowNewNote(true);
                setSelectedNote(null);
                setEditedTitle("");
                setEditedContent("");
              }}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                border: "none",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Plus size={16} />
              New Note
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => {
                setSelectedNote(note);
                setEditedTitle(note.title);
                setEditedContent(note.content);
                setShowNewNote(false);
              }}
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "12px",
                padding: "20px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--foreground)", marginBottom: "8px" }}>
                {note.title}
              </h3>
              <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: "1.5", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                {note.content}
              </p>
              <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "12px" }}>
                {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {/* Edit/New Note Modal */}
        {(selectedNote || showNewNote) && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => {
              setSelectedNote(null);
              setShowNewNote(false);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--background)",
                border: "1px solid var(--glass-border)",
                borderRadius: "16px",
                maxWidth: "800px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                padding: "32px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Note Title"
                  style={{
                    flex: 1,
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "var(--foreground)",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                  }}
                />
                
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleSave}
                    style={{
                      padding: "8px 16px",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Save size={16} />
                    Save
                  </button>
                  
                  {selectedNote && (
                    <button
                      onClick={() => handleDelete(selectedNote.id)}
                      style={{
                        padding: "8px",
                        background: "var(--glass-bg)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={16} style={{ color: "#ef4444" }} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedNote(null);
                      setShowNewNote(false);
                    }}
                    style={{
                      padding: "8px",
                      background: "var(--glass-bg)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <X size={16} style={{ color: "var(--foreground)" }} />
                  </button>
                </div>
              </div>

              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Start writing..."
                style={{
                  width: "100%",
                  minHeight: "400px",
                  padding: "16px",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
