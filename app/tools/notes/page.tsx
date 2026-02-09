"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { StickyNote, Plus, Trash2, Edit } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({});

  useEffect(() => {
    setNotes([
      {
        id: "1",
        title: "Project Ideas",
        content: "1. Build a command center\n2. Integrate with Notion\n3. Add Jimmy assistant",
        createdAt: "2026-02-08",
        updatedAt: "2026-02-09",
      },
      {
        id: "2",
        title: "Meeting Notes",
        content: "Discussed Q1 goals and deliverables...",
        createdAt: "2026-02-07",
        updatedAt: "2026-02-07",
      },
    ]);
  }, []);

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <StickyNote style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>Notes</h1>
            </div>
            <button onClick={() => setShowEditor(true)} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "var(--accent)", color: "var(--background)", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus style={{ width: "16px", height: "16px" }} />
              New Note
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {notes.map(note => (
              <div key={note.id} className="glass" style={{ padding: "20px", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>{note.title}</div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { setCurrentNote(note); setShowEditor(true); }} style={{ padding: "6px", borderRadius: "6px", border: "none", background: "transparent", color: "var(--foreground-muted)", cursor: "pointer" }}>
                      <Edit style={{ width: "14px", height: "14px" }} />
                    </button>
                    <button onClick={() => deleteNote(note.id)} style={{ padding: "6px", borderRadius: "6px", border: "none", background: "transparent", color: "#ef4444", cursor: "pointer" }}>
                      <Trash2 style={{ width: "14px", height: "14px" }} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.6, marginBottom: "12px", whiteSpace: "pre-wrap" }}>
                  {note.content.substring(0, 150)}{note.content.length > 150 ? "..." : ""}
                </div>
                <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                  Updated {note.updatedAt}
                </div>
              </div>
            ))}
          </div>

          {notes.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--foreground-muted)" }}>
              No notes yet. Click "New Note" to get started.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
