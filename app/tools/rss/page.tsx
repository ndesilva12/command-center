"use client";

import { Rss } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

export default function RSSPage() {
  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="rss" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <Rss style={{ width: "24px", height: "24px", color: "#00aaff" }} />
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>RSS</h1>
        </div>
        <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "60px 20px", textAlign: "center" }}>
          <Rss style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>RSS Tool Coming Soon</h2>
          <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>RSS feed reader</p>
        </div>
      </main>
    </>
  );
}
