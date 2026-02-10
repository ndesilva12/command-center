"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ConnectedAccounts } from "@/components/settings/ConnectedAccounts";
import { ToolCustomization } from "@/components/settings/ToolCustomization";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export default function SettingsPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [raindropConnected, setRaindropConnected] = useState(false);
  const [checkingRaindrop, setCheckingRaindrop] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Check Raindrop connection status
    const checkConnections = async () => {
      try {
        const raindropRes = await fetch('/api/auth/raindrop/status');
        setRaindropConnected(raindropRes.ok);
      } catch (e) {
        console.error('Failed to check Raindrop connection:', e);
      } finally {
        setCheckingRaindrop(false);
      }
    };
    checkConnections();
  }, []);

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
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
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

          {/* Connected Google Accounts Section */}
          <div style={{ marginBottom: "32px" }}>
            <ConnectedAccounts />
          </div>

          {/* Admin Dashboard - Admin Only */}
          {isAdmin && (
            <div style={{ marginBottom: "32px" }}>
              <div className="card" style={{ padding: "24px" }}>
                <h2 style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  marginBottom: "16px",
                  color: "var(--foreground)"
                }}>
                  Administration
                </h2>
                <Link
                  href="/admin"
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    border: "none",
                    borderRadius: "12px",
                    color: "white",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(139, 92, 246, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Shield style={{ width: "20px", height: "20px" }} />
                  <span>Admin Dashboard</span>
                </Link>
              </div>
            </div>
          )}

          {/* Tool Customization Section */}
          <div style={{ marginBottom: "32px" }}>
            <ToolCustomization />
          </div>

          {/* Raindrop OAuth Section */}
          <div style={{ marginBottom: "32px" }}>
            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{
                fontSize: "20px",
                fontWeight: 600,
                marginBottom: "16px",
                color: "var(--foreground)"
              }}>
                Other Connected Services
              </h2>

              <button
                onClick={handleRaindropConnect}
                disabled={checkingRaindrop}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  background: raindropConnected
                    ? "linear-gradient(135deg, #0088cc, #006699)"
                    : "linear-gradient(135deg, #00aaff, #0088cc)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: checkingRaindrop ? "wait" : "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: checkingRaindrop ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!checkingRaindrop) {
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
        </div>
      </main>
    </>
  );
}
