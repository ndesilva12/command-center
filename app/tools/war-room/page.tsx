"use client";

import { useState, useEffect } from "react";
import { Crosshair } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { WarRoom } from "./WarRoom";

export default function WarRoomPage() {
  return (
    <ProtectedRoute>
      <WarRoomContent />
    </ProtectedRoute>
  );
}

function WarRoomContent() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization("war-room", "War Room", "#3b82f6");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />
      <Sidebar />
      <ToolBackground color={toolCustom.color} />
      <main
        style={{
          paddingTop: isMobile ? "72px" : "76px",
          paddingBottom: isMobile ? "88px" : "32px",
          paddingLeft: isMobile ? "12px" : "264px",
          paddingRight: isMobile ? "12px" : "24px",
          minHeight: "100vh",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Crosshair style={{ width: "32px", height: "32px", color: "#3b82f6" }} />
            <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              War Room
            </h1>
          </div>
          <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
            Basketball intelligence · Portal scouting · Roster building · Network mapping
          </p>
        </div>

        <WarRoom isMobile={isMobile} />
      </main>
    </>
  );
}
