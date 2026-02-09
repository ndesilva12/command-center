"use client";

import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

// Tool metadata mapping
const TOOL_INFO: Record<string, { name: string; description: string; color: string }> = {
  curate: { name: "Curate", description: "Curated intelligence feeds and insights", color: "#8b5cf6" },
  l3d: { name: "L3D", description: "Last 30 days research and analytics", color: "#10b981" },
  "deep-search": { name: "Deep Search", description: "Deep web search capabilities", color: "#6366f1" },
  "dark-search": { name: "Dark Search", description: "Dark web search and monitoring", color: "#dc2626" },
  "image-lookup": { name: "Image Lookup", description: "Reverse image search and analysis", color: "#a78bfa" },
  "contact-finder": { name: "Contact Finder", description: "Find contact information", color: "#6366f1" },
  relationships: { name: "Relationships", description: "Contact insights and relationships", color: "#14b8a6" },
  mission: { name: "Mission", description: "Task and mission management", color: "#f59e0b" },
  investors: { name: "Investors", description: "Fundraising pipeline management", color: "#3b82f6" },
  "business-info": { name: "Business Info", description: "Company research and insights", color: "#8b5cf6" },
  corporate: { name: "Corporate", description: "Corporate intelligence", color: "#10b981" },
  emails: { name: "Emails", description: "Email management and inbox", color: "#3b82f6" },
  calendar: { name: "Calendar", description: "Schedule and events", color: "#10b981" },
  contacts: { name: "Contacts", description: "Contact database", color: "#8b5cf6" },
  people: { name: "People", description: "Manage your contacts", color: "#06b6d4" },
  recommendations: { name: "Recommendations", description: "Track suggestions and referrals", color: "#ec4899" },
  news: { name: "News", description: "News aggregation", color: "#64748b" },
  rss: { name: "RSS", description: "RSS feed reader", color: "#10b981" },
  bookmarks: { name: "Bookmarks", description: "Bookmark manager", color: "#06b6d4" },
  market: { name: "Market", description: "Market data and insights", color: "#3b82f6" },
  notes: { name: "Notes", description: "Note taking", color: "#a78bfa" },
  files: { name: "Files", description: "File storage and management", color: "#6366f1" },
  spotify: { name: "Spotify", description: "Music streaming", color: "#1DB954" },
  trending: { name: "Trending", description: "What's trending", color: "#14b8a6" },
  rosters: { name: "Rosters", description: "Team rosters and analytics", color: "#3b82f6" },
};

export default function ToolPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toolInfo = TOOL_INFO[slug] || {
    name: slug?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    description: "Tool details coming soon",
    color: "#3b82f6",
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
          {/* Back Button */}
          <button
            onClick={() => router.push("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              marginBottom: "24px",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--muted)",
              background: "transparent",
              border: "1px solid var(--glass-border)",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.background = "var(--glass-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to Dashboard
          </button>

          {/* Coming Soon Card */}
          <div
            className="card"
            style={{
              padding: "48px 32px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(135deg, ${toolInfo.color}10 0%, transparent 100%)`,
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  background: `${toolInfo.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px auto",
                }}
              >
                <Sparkles style={{ width: "40px", height: "40px", color: toolInfo.color }} />
              </div>
              <h1
                style={{
                  fontSize: isMobile ? "32px" : "40px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  marginBottom: "12px",
                }}
              >
                {toolInfo.name}
              </h1>
              <p
                style={{
                  fontSize: "18px",
                  color: "var(--muted)",
                  marginBottom: "32px",
                  maxWidth: "500px",
                  margin: "0 auto 32px auto",
                }}
              >
                {toolInfo.description}
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  background: `${toolInfo.color}20`,
                  border: `1px solid ${toolInfo.color}40`,
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: toolInfo.color,
                }}
              >
                <Sparkles style={{ width: "16px", height: "16px" }} />
                Coming Soon
              </div>
            </div>
          </div>

          {/* Feature Preview */}
          <div style={{ marginTop: "24px" }}>
            <div
              className="card"
              style={{
                padding: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--foreground)",
                  marginBottom: "16px",
                }}
              >
                What to Expect
              </h2>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <li style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: toolInfo.color,
                      marginTop: "8px",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "var(--muted)", lineHeight: "1.6" }}>
                    Powerful search and filtering capabilities
                  </span>
                </li>
                <li style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: toolInfo.color,
                      marginTop: "8px",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "var(--muted)", lineHeight: "1.6" }}>
                    Clean, intuitive interface
                  </span>
                </li>
                <li style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: toolInfo.color,
                      marginTop: "8px",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "var(--muted)", lineHeight: "1.6" }}>
                    Integration with your existing workflows
                  </span>
                </li>
                <li style={{ display: "flex", alignItems: "start", gap: "12px" }}>
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: toolInfo.color,
                      marginTop: "8px",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "var(--muted)", lineHeight: "1.6" }}>
                    Mobile-optimized experience
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
