"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Droplets, Plus, ExternalLink, Tag } from "lucide-react";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  tags: string[];
  createdAt: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setBookmarks([
      { id: "1", title: "Next.js Documentation", url: "https://nextjs.org/docs", tags: ["dev", "react"], createdAt: "2 days ago" },
      { id: "2", title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs", tags: ["dev", "typescript"], createdAt: "1 week ago" },
      { id: "3", title: "Design Inspiration", url: "https://dribbble.com", tags: ["design"], createdAt: "3 days ago" },
    ]);
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Droplets style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>Bookmarks</h1>
            </div>
            <button style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "var(--accent)", color: "var(--background)", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus style={{ width: "16px", height: "16px" }} />
              Add Bookmark
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {bookmarks.map(bookmark => (
              <a key={bookmark.id} href={bookmark.url} target="_blank" rel="noopener noreferrer" className="glass" style={{ display: "block", padding: "20px", borderRadius: "12px", textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>{bookmark.title}</div>
                  <ExternalLink style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "12px", wordBreak: "break-all" }}>{bookmark.url}</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {bookmark.tags.map(tag => (
                    <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.1)", fontSize: "11px", color: "var(--foreground-muted)" }}>
                      <Tag style={{ width: "10px", height: "10px" }} />
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
