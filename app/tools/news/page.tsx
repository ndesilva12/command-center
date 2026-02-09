"use client";

import { useState, useEffect } from "react";
import { Newspaper, ExternalLink, RefreshCw } from "lucide-react";

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
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "80px 20px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Newspaper size={48} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "var(--foreground)", margin: 0 }}>News</h1>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => window.open('https://news.google.com', '_blank')}
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
              Google News
            </button>
            
            <button
              onClick={loadNews}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                border: "none",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "8px 16px",
                background: category === cat ? "linear-gradient(135deg, var(--primary), var(--primary-dark))" : "var(--glass-bg)",
                border: category === cat ? "none" : "1px solid var(--glass-border)",
                borderRadius: "8px",
                color: category === cat ? "white" : "var(--foreground)",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>Loading news...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {articles.map((article, idx) => (
              <a
                key={idx}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "12px",
                  padding: "20px",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--glass-bg-hover)";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--glass-bg)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--foreground)", marginBottom: "8px", lineHeight: "1.4" }}>
                  {article.title}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "var(--muted)" }}>
                  <span>{article.source}</span>
                  <span>•</span>
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
