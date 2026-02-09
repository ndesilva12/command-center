"use client";

import { FileText, Plus, Search } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

export default function NotesPage() {
  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="notes" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>Notes</h1>
          </div>

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
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0095dd")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#00aaff")}
          >
            <Plus style={{ width: "14px", height: "14px" }} />
            New Note
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
            <input
              type="text"
              placeholder="Search notes..."
              style={{
                width: "100%",
                padding: "12px 16px 12px 44px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(16px)",
                color: "var(--foreground)",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.15s ease",
              }}
            />
          </div>
        </div>

        {/* Content Area - Coming Soon */}
        <div className="glass" style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "60px 20px",
          textAlign: "center"
        }}>
          <FileText style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
            Notes Tool Coming Soon
          </h2>
          <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
            Quick notes and memos with Firestore sync
          </p>
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "24px"
          }}>
            {["Personal", "Work", "Ideas", "Todo"].map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--foreground-muted)",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
