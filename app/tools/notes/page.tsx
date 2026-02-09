"use client";

import { FileText, Plus } from "lucide-react";
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>Notes</h1>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", backgroundColor: "#00aaff", color: "#000", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
            <Plus style={{ width: "14px", height: "14px" }} />
            New Note
          </button>
        </div>
        <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "60px 20px", textAlign: "center" }}>
          <FileText style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>Notes Tool Coming Soon</h2>
          <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>Quick notes and memos</p>
        </div>
      </main>
    </>
  );
}
