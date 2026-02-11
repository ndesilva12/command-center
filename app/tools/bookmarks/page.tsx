"use client";

import { useState, useEffect } from "react";
import { Bookmark, Plus, RefreshCw, ExternalLink, Search, Folder } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

export default function BookmarksPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="bookmarks" />

      <main style={{
        paddingTop: isMobile ? "80px" : "136px",
        paddingBottom: isMobile ? "80px" : "32px",
        paddingLeft: isMobile ? "12px" : "24px",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Bookmark style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>Bookmarks</h1>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href="https://raindrop.io"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                textDecoration: "none",
                fontSize: "13px",
                transition: "all 0.15s",
              }}
            >
              <ExternalLink style={{ width: "14px", height: "14px" }} />
              Open in Raindrop
            </a>
            
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px" }} />
              Refresh
            </button>
            
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "#00aaff",
                color: "#000",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <Plus style={{ width: "14px", height: "14px" }} />
              Add Bookmark
            </button>
          </div>
        </div>

        {/* Collections Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
          {["All", "Tech", "Work", "Reading List", "L3D Research"].map((collection, idx) => (
            <button
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: idx === 0 ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.03)",
                color: idx === 0 ? "#00aaff" : "var(--foreground-muted)",
                border: idx === 0 ? "1px solid rgba(0, 170, 255, 0.3)" : "1px solid transparent",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: idx === 0 ? 500 : 400,
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              <Folder style={{ width: "14px", height: "14px" }} />
              {collection}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <Search style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search bookmarks..."
              style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "14px" }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", overflow: "hidden", padding: "60px 20px", textAlign: "center" }}>
          <Bookmark style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
            Bookmarks Tool Coming Soon
          </h2>
          <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
            Manage your Raindrop.io bookmarks
          </p>
          <p style={{ color: "var(--foreground-muted)", fontSize: "12px", fontStyle: "italic" }}>
            Will include: Collections view, Add bookmark, Search, Tags, OAuth integration
          </p>
        </div>
      </main>
    </>
  );
}
