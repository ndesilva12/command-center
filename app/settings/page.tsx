"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "80px",
          paddingBottom: isMobile ? "96px" : "32px",
          padding: isMobile ? "80px 16px 96px 16px" : "80px 24px 32px 24px",
        }}
      >
        <div className="container" style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: isMobile ? "28px" : "36px",
              fontWeight: 700,
              color: "var(--foreground)",
              marginBottom: "8px",
            }}
          >
            Settings
          </h1>
          <p style={{ fontSize: "16px", color: "var(--muted)", marginBottom: "32px" }}>
            Manage your preferences and account settings
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <SettingSection
              icon={User}
              title="Profile"
              description="Manage your profile information"
              color="#3b82f6"
            />
            <SettingSection
              icon={Bell}
              title="Notifications"
              description="Configure notification preferences"
              color="#10b981"
            />
            <SettingSection
              icon={Shield}
              title="Privacy & Security"
              description="Manage security and privacy settings"
              color="#dc2626"
            />
            <SettingSection
              icon={Palette}
              title="Appearance"
              description="Customize the look and feel"
              color="#8b5cf6"
            />
          </div>
        </div>
      </main>
    </>
  );
}

function SettingSection({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--glass-border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: `${color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: "24px", height: "24px", color: color }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--foreground)",
              marginBottom: "4px",
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: "14px", color: "var(--muted)" }}>{description}</p>
        </div>
      </div>
    </div>
  );
}
