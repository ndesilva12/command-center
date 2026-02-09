"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from "lucide-react";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [raindropConnected, setRaindropConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Check OAuth connection status
    const checkConnections = async () => {
      try {
        const [googleRes, raindropRes] = await Promise.all([
          fetch('/api/auth/google/status'),
          fetch('/api/auth/raindrop/status')
        ]);

        setGoogleConnected(googleRes.ok);
        setRaindropConnected(raindropRes.ok);
      } catch (e) {
        console.error('Failed to check connections:', e);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkConnections();
  }, []);

  const handleGoogleConnect = async () => {
    try {
      const res = await fetch('/api/auth/google?returnUrl=/settings');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to initiate Google auth:", err);
      alert("Failed to connect to Google");
    }
  };

  const handleRaindropConnect = async () => {
    try {
      const res = await fetch('/api/auth/raindrop?returnUrl=/settings');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to initiate Raindrop auth:", err);
      alert("Failed to connect to Raindrop");
    }
  };

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

          {/* Connected Accounts Section */}
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px", color: "var(--foreground)" }}>
              Connected Accounts
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Google OAuth Button */}
              <button
                onClick={handleGoogleConnect}
                disabled={checkingStatus}
                style={{
                  padding: "16px 24px",
                  background: googleConnected 
                    ? "linear-gradient(135deg, #34a853, #2d8e47)" 
                    : "linear-gradient(135deg, #4285f4, #34a853)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: checkingStatus ? "wait" : "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: checkingStatus ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!checkingStatus) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(66, 133, 244, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span>🔐 {googleConnected ? "Google Connected" : "Connect Google Account"}</span>
                {googleConnected && <span style={{ fontSize: "20px" }}>✓</span>}
              </button>
              
              {/* Raindrop OAuth Button */}
              <button
                onClick={handleRaindropConnect}
                disabled={checkingStatus}
                style={{
                  padding: "16px 24px",
                  background: raindropConnected
                    ? "linear-gradient(135deg, #0088cc, #006699)"
                    : "linear-gradient(135deg, #00aaff, #0088cc)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: checkingStatus ? "wait" : "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: checkingStatus ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!checkingStatus) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 170, 255, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span>🔖 {raindropConnected ? "Raindrop Connected" : "Connect Raindrop (Bookmarks)"}</span>
                {raindropConnected && <span style={{ fontSize: "20px" }}>✓</span>}
              </button>
            </div>
          </div>

          {/* Other Settings Sections */}
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
