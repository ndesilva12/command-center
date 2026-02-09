"use client";

import { useState, useEffect } from "react";
import { Bookmark, ExternalLink, LogIn } from "lucide-react";

export default function BookmarksPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if raindrop token exists in cookies
    const cookies = document.cookie.split(';');
    const hasRaindropToken = cookies.some(c => c.trim().startsWith('raindrop_access_token='));
    setIsAuthenticated(hasRaindropToken);
    setLoading(false);
  }, []);

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/auth/raindrop');
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
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "80px 20px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Bookmark size={48} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "var(--foreground)", margin: 0 }}>Bookmarks</h1>
          </div>
          
          <button
            onClick={() => window.open('https://raindrop.io', '_blank')}
            style={{
              padding: "10px 20px",
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "8px",
              color: "var(--foreground)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ExternalLink size={16} />
            Open Raindrop.io
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>Loading...</p>
        ) : !isAuthenticated ? (
          <div style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            borderRadius: "16px",
            padding: "60px 40px",
            textAlign: "center",
            maxWidth: "600px",
            margin: "60px auto",
          }}>
            <Bookmark size={64} style={{ color: "var(--primary)", margin: "0 auto 24px" }} />
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--foreground)", marginBottom: "12px" }}>
              Connect to Raindrop.io
            </h2>
            <p style={{ fontSize: "16px", color: "var(--muted)", marginBottom: "32px", lineHeight: "1.6" }}>
              Raindrop.io is a powerful bookmark manager. Connect your account to access your bookmarks here.
            </p>
            <button
              onClick={handleConnect}
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <LogIn size={20} />
              Connect Raindrop.io
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: "18px", color: "var(--foreground)", marginBottom: "16px" }}>
              ✅ Connected to Raindrop.io
            </p>
            <p style={{ fontSize: "14px", color: "var(--muted)" }}>
              Bookmark management interface coming soon. For now, use Raindrop.io directly.
            </p>
            <button
              onClick={() => window.open('https://raindrop.io', '_blank')}
              style={{
                marginTop: "24px",
                padding: "12px 24px",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "8px",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ExternalLink size={16} />
              Open Raindrop.io
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
