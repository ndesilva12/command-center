"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { BookOpen, Plus, ExternalLink } from "lucide-react";

interface RSSItem {
  id: string;
  title: string;
  feed: string;
  link: string;
  pubDate: string;
  read: boolean;
}

export default function RSSPage() {
  const [items, setItems] = useState<RSSItem[]>([]);

  useEffect(() => {
    setItems([
      { id: "1", title: "Latest Tech Trends", feed: "TechCrunch", link: "#", pubDate: "1 hour ago", read: false },
      { id: "2", title: "Web Development Best Practices", feed: "CSS-Tricks", link: "#", pubDate: "3 hours ago", read: true },
      { id: "3", title: "AI and Machine Learning Updates", feed: "ML News", link: "#", pubDate: "5 hours ago", read: false },
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
              <BookOpen style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>RSS Feeds</h1>
            </div>
            <button style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "var(--accent)", color: "var(--background)", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus style={{ width: "16px", height: "16px" }} />
              Add Feed
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map(item => (
              <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="glass" style={{ display: "block", padding: "20px", borderRadius: "12px", textDecoration: "none", borderLeft: item.read ? "3px solid transparent" : "3px solid var(--accent)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: item.read ? 400 : 600, color: "var(--foreground)", marginBottom: "6px" }}>{item.title}</div>
                    <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{item.feed} • {item.pubDate}</div>
                  </div>
                  <ExternalLink style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
