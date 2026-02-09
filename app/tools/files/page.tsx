"use client";

import { useState, useEffect } from "react";
import { FolderOpen, ExternalLink, RefreshCw } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

export default function FilesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    // Check if Google tokens exist in cookies
    const cookies = document.cookie.split(';');
    const hasGoogleToken = cookies.some(c => c.trim().startsWith('google_tokens='));
    setIsAuthenticated(hasGoogleToken);
    setLoading(false);
  };

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/auth/google?returnUrl=/tools/files');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to initiate Google auth:", err);
      alert("Failed to connect to Google Drive");
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="files" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FolderOpen style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>Files</h1>
          </div>

          <button
            onClick={() => window.open('https://drive.google.com', '_blank')}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "var(--foreground-muted)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              cursor: "pointer",
              fontSize: "13px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "#00aaff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.color = "var(--foreground-muted)";
            }}
          >
            <ExternalLink style={{ width: "14px", height: "14px" }} />
            Open Drive
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "60px 20px", textAlign: "center" }}>
            <RefreshCw style={{ width: "32px", height: "32px", color: "#00aaff", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "var(--foreground-muted)" }}>Loading...</p>
          </div>
        ) : !isAuthenticated ? (
          <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "60px 20px", textAlign: "center" }}>
            <FolderOpen style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              Connect to Google Drive
            </h2>
            <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "24px" }}>
              Access your Google Drive files directly from Command Center
            </p>
            <button
              onClick={handleConnect}
              style={{
                padding: "10px 20px",
                background: "#00aaff",
                border: "none",
                borderRadius: "8px",
                color: "#000",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0095dd")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#00aaff")}
            >
              Connect Google Drive
            </button>
          </div>
        ) : (
          <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "60px 20px", textAlign: "center" }}>
            <FolderOpen style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              ✅ Connected to Google Drive
            </h2>
            <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
              File browser interface coming soon
            </p>
            <button
              onClick={() => window.open('https://drive.google.com', '_blank')}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "var(--foreground)",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "#00aaff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              <ExternalLink style={{ width: "16px", height: "16px" }} />
              Open Google Drive
            </button>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
