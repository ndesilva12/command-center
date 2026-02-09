"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Newspaper, ExternalLink } from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  url: string;
  publishedAt: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [category, setCategory] = useState("all");

  const categories = ["all", "tech", "business", "sports", "health", "entertainment"];

  useEffect(() => {
    // Placeholder news data
    setArticles([
      {
        id: "1",
        title: "AI Breakthrough in Medical Research",
        source: "Tech News",
        category: "tech",
        url: "#",
        publishedAt: "2 hours ago",
      },
      {
        id: "2",
        title: "Stock Market Reaches New Heights",
        source: "Business Daily",
        category: "business",
        url: "#",
        publishedAt: "4 hours ago",
      },
      {
        id: "3",
        title: "Championship Finals This Weekend",
        source: "Sports Network",
        category: "sports",
        url: "#",
        publishedAt: "6 hours ago",
      },
    ]);
  }, []);

  const filteredArticles = category === "all" 
    ? articles 
    : articles.filter(a => a.category === category);

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <Newspaper style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>News</h1>
          </div>

          {/* Category Filter */}
          <div className="glass" style={{ padding: "16px", borderRadius: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: "1px solid var(--glass-border)",
                    background: category === cat ? "var(--accent)" : "transparent",
                    color: category === cat ? "var(--background)" : "var(--foreground)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Articles */}
          <div style={{ display: "grid", gap: "16px" }}>
            {filteredArticles.map(article => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass"
                style={{
                  display: "block",
                  padding: "24px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                      {article.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                      <span>{article.source}</span>
                      <span>•</span>
                      <span style={{ textTransform: "capitalize" }}>{article.category}</span>
                      <span>•</span>
                      <span>{article.publishedAt}</span>
                    </div>
                  </div>
                  <ExternalLink style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
