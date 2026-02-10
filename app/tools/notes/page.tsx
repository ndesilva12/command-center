"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Search, RefreshCw, ExternalLink, Calendar, Edit, Database, File } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

interface NotionPage {
  id: string;
  object: string;
  properties?: any;
  icon?: any;
  cover?: any;
  url?: string;
  last_edited_time?: string;
  title?: any;
}

export default function NotesPage() {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [databases, setDatabases] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pages" | "databases">("pages");

  useEffect(() => {
    fetchNotionData();
  }, []);

  const fetchNotionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pagesRes, dbsRes] = await Promise.all([
        fetch('/api/notion/pages'),
        fetch('/api/notion/databases')
      ]);

      if (!pagesRes.ok || !dbsRes.ok) {
        throw new Error('Failed to fetch Notion data');
      }

      const pagesData = await pagesRes.json();
      const dbsData = await dbsRes.json();

      setPages(pagesData.results || []);
      setDatabases(dbsData.databases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Notion data');
    } finally {
      setLoading(false);
    }
  };

  const getPageTitle = (page: NotionPage): string => {
    if (page.properties) {
      const titleProp = Object.values(page.properties).find((prop: any) => prop.type === 'title') as any;
      if (titleProp && titleProp.title && titleProp.title[0]) {
        return titleProp.title[0].plain_text;
      }
    }
    return 'Untitled';
  };

  const getPageIcon = (page: NotionPage): string => {
    if (page.icon) {
      if (page.icon.type === 'emoji') return page.icon.emoji;
      if (page.icon.type === 'external') return '🔗';
      if (page.icon.type === 'file') return '📄';
    }
    return page.object === 'database' ? '🗂️' : '📝';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredPages = pages.filter(page =>
    getPageTitle(page).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDatabases = databases.filter(db =>
    getPageTitle(db).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItems = activeTab === 'pages' ? filteredPages : filteredDatabases;

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="notes" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText style={{ width: "24px", height: "24px", color: "#a78bfa" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              Notes {!loading && !error && <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>({currentItems.length})</span>}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href="https://notion.so"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                textDecoration: "none",
                fontSize: "13px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.color = "#a78bfa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "var(--foreground-muted)";
              }}
            >
              <ExternalLink style={{ width: "14px", height: "14px" }} />
              Open in Notion
            </a>

            <button
              onClick={fetchNotionData}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "13px",
                opacity: loading ? 0.5 : 1,
              }}
            >
              <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
          <button
            onClick={() => setActiveTab("pages")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor: activeTab === "pages" ? "rgba(167, 139, 250, 0.15)" : "rgba(255, 255, 255, 0.03)",
              color: activeTab === "pages" ? "#a78bfa" : "var(--foreground-muted)",
              border: activeTab === "pages" ? "1px solid rgba(167, 139, 250, 0.3)" : "1px solid transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeTab === "pages" ? 500 : 400,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <File style={{ width: "14px", height: "14px" }} />
            Pages ({filteredPages.length})
          </button>
          <button
            onClick={() => setActiveTab("databases")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor: activeTab === "databases" ? "rgba(167, 139, 250, 0.15)" : "rgba(255, 255, 255, 0.03)",
              color: activeTab === "databases" ? "#a78bfa" : "var(--foreground-muted)",
              border: activeTab === "databases" ? "1px solid rgba(167, 139, 250, 0.3)" : "1px solid transparent",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeTab === "databases" ? 500 : 400,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Database style={{ width: "14px", height: "14px" }} />
            Databases ({filteredDatabases.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center"
          }}>
            <RefreshCw style={{ width: "32px", height: "32px", color: "#a78bfa", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "var(--foreground-muted)" }}>Loading Notion data...</p>
          </div>
        ) : error ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center"
          }}>
            <FileText style={{ width: "48px", height: "48px", color: "#f87171", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              {error}
            </h2>
            <button
              onClick={fetchNotionData}
              style={{
                marginTop: "16px",
                padding: "8px 16px",
                borderRadius: "6px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "var(--foreground)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        ) : currentItems.length === 0 ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center"
          }}>
            <FileText style={{ width: "48px", height: "48px", color: "#a78bfa", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              No {activeTab} found
            </h2>
            <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
              {searchQuery ? 'Try a different search term' : `Your Notion ${activeTab} will appear here`}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px"
          }}>
            {currentItems.map((item) => (
              <div
                key={item.id}
                onClick={() => item.url && window.open(item.url, '_blank')}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                }}
              >
                <div style={{ display: "flex", alignItems: "start", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "32px" }}>{getPageIcon(item)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      marginBottom: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {getPageTitle(item)}
                    </h3>
                    {item.last_edited_time && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                        <Calendar style={{ width: "12px", height: "12px" }} />
                        {formatDate(item.last_edited_time)}
                      </div>
                    )}
                  </div>
                  <ExternalLink style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                </div>
              </div>
            ))}
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
