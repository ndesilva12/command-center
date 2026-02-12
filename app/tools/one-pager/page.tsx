"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TopNav from "@/components/navigation/TopNav";
import BottomNav from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import ReactMarkdown from "react-markdown";

export default function OnePagerPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const q = query(
        collection(db, "one_pagers_history"),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(items);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/one-pager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), save: true })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        loadHistory(); // Reload history
      } else {
        alert(data.error || "Failed to generate one-pager");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate one-pager");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ paddingTop: "144px", paddingBottom: "80px", minHeight: "calc(100vh - 144px)" }}>
        <TopNav />
        <ToolNav currentToolId="one-pager" />
        
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 12px" }}>
          {/* Input Form */}
          <div className="glass card" style={{ padding: "24px", marginBottom: "24px" }}>
            <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: 700 }}>
              📑 One-Pager Generator
            </h2>
            <p style={{ marginBottom: "20px", color: "var(--muted)", fontSize: "14px" }}>
              Generate comprehensive single-page summaries with executive summary, data table, visual description, key points, and curated links
            </p>
            
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic or question (e.g., What are the key arguments for Bitcoin as a store of value?)"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg)",
                  color: "var(--foreground)",
                  fontSize: "15px",
                  marginBottom: "12px"
                }}
                disabled={loading}
              />
              
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: loading ? "var(--muted)" : "linear-gradient(135deg, #00aaff, #0088cc)",
                  color: "#fff",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Generating..." : "Generate One-Pager"}
              </button>

              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  marginLeft: "12px",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {showHistory ? "Hide History" : "Show History"}
              </button>
            </form>
          </div>

          {/* Result */}
          {result && result.content && (
            <div className="glass card" style={{ padding: "32px", marginBottom: "24px" }}>
              <div className="markdown-content">
                <ReactMarkdown>{result.content}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* History */}
          {showHistory && history.length > 0 && (
            <div className="glass card" style={{ padding: "24px" }}>
              <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: 700 }}>
                Recent One-Pagers
              </h3>
              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setResult(item)}
                  style={{
                    padding: "12px",
                    marginBottom: "8px",
                    borderRadius: "6px",
                    background: "var(--glass-bg)",
                    cursor: "pointer",
                    border: "1px solid transparent"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#00aaff"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                >
                  <div style={{ fontWeight: 600 }}>{item.topic}</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                    {new Date(item.timestamp).toLocaleString()} • {item.links?.length || 0} links
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />

      <style jsx global>{`
        .markdown-content h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 20px;
          color: var(--foreground);
        }
        .markdown-content h2 {
          font-size: 22px;
          font-weight: 700;
          margin-top: 28px;
          margin-bottom: 16px;
          color: #00aaff;
        }
        .markdown-content h3 {
          font-size: 18px;
          font-weight: 600;
          margin-top: 20px;
          margin-bottom: 12px;
        }
        .markdown-content p {
          margin-bottom: 16px;
          line-height: 1.7;
        }
        .markdown-content ul, .markdown-content ol {
          margin-bottom: 16px;
          padding-left: 24px;
        }
        .markdown-content li {
          margin-bottom: 8px;
          line-height: 1.6;
        }
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .markdown-content th, .markdown-content td {
          border: 1px solid var(--glass-border);
          padding: 12px;
          text-align: left;
        }
        .markdown-content th {
          background: var(--glass-bg);
          font-weight: 600;
        }
        .markdown-content a {
          color: #00aaff;
          text-decoration: none;
        }
        .markdown-content a:hover {
          text-decoration: underline;
        }
        .markdown-content hr {
          border: none;
          border-top: 1px solid var(--glass-border);
          margin: 24px 0;
        }
        .markdown-content strong {
          font-weight: 600;
        }
      `}</style>
    </>
  );
}
