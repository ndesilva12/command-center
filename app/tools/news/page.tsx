"use client";

import { useState, useEffect } from "react";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

interface Article {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("general");
  const categories = ["general", "world", "business", "technology", "entertainment", "sports", "science", "health"];

  useEffect(() => {
    loadNews();
  }, [category]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?category=${category}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="news" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Newspaper style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
              News {articles.length > 0 && <span style={{ color: "var(--foreground-muted)", fontWeight: 400 }}>({articles.length})</span>}
            </h1>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href="https://news.google.com"
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
                transition: "all 0.15s",
              }}
            >
              <ExternalLink style={{ width: "14px", height: "14px" }} />
              Open in Google News
            </a>
            
            <button
              onClick={loadNews}
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

        {/* Categories */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: category === cat ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.03)",
                color: category === cat ? "#00aaff" : "var(--foreground-muted)",
                border: category === cat ? "1px solid rgba(0, 170, 255, 0.3)" : "1px solid transparent",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: category === cat ? 500 : 400,
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                flexShrink: 0,
                textTransform: "capitalize",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <RefreshCw style={{ width: "32px", height: "32px", color: "#00aaff", animation: "spin 1s linear infinite" }} />
            </div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Newspaper style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                No articles found
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                Try selecting a different category
              </p>
            </div>
          ) : (
            <div>
              {articles.map((article, index) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    padding: "16px 20px",
                    borderBottom: index < articles.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px", lineHeight: 1.4 }}>
                    {article.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{new Date(article.publishedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
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
