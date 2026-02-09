"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Mail, Search, Loader2, Inbox, Star, Archive, Trash2 } from "lucide-react";

interface Email {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  read: boolean;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    // Placeholder data for now
    setEmails([
      {
        id: "1",
        from: "John Doe",
        subject: "Meeting Tomorrow",
        snippet: "Hi, just wanted to confirm our meeting at 2 PM tomorrow...",
        date: "2 hours ago",
        read: false,
      },
      {
        id: "2",
        from: "Jane Smith",
        subject: "Project Update",
        snippet: "The latest project deliverables are ready for review...",
        date: "5 hours ago",
        read: true,
      },
      {
        id: "3",
        from: "Tech Team",
        subject: "System Maintenance",
        snippet: "Scheduled maintenance will occur this weekend...",
        date: "1 day ago",
        read: true,
      },
    ]);
    setLoading(false);
  }, []);

  const filteredEmails = emails.filter(email => {
    if (filter === "unread" && email.read) return false;
    if (searchQuery && !email.subject.toLowerCase().includes(searchQuery.toLowerCase()) && !email.from.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const toggleRead = (id: string) => {
    setEmails(emails.map(email => 
      email.id === id ? { ...email, read: !email.read } : email
    ));
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <Mail style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>Emails</h1>
          </div>

          {/* Search and Filters */}
          <div className="glass" style={{ padding: "20px", borderRadius: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search emails..."
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 44px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setFilter("all")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: filter === "all" ? "var(--accent)" : "transparent",
                  color: filter === "all" ? "var(--background)" : "var(--foreground)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: filter === "unread" ? "var(--accent)" : "transparent",
                  color: filter === "unread" ? "var(--background)" : "var(--foreground)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Unread
              </button>
            </div>
          </div>

          {/* Email List */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
              <Loader2 style={{ width: "32px", height: "32px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredEmails.map(email => (
                <div
                  key={email.id}
                  className="glass"
                  style={{
                    padding: "20px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    borderLeft: email.read ? "3px solid transparent" : "3px solid var(--accent)",
                  }}
                  onClick={() => toggleRead(email.id)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                        {email.from}
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: email.read ? 400 : 600, color: "var(--foreground)" }}>
                        {email.subject}
                      </div>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--foreground-muted)", flexShrink: 0 }}>
                      {email.date}
                    </span>
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                    {email.snippet}
                  </div>
                </div>
              ))}

              {filteredEmails.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px", color: "var(--foreground-muted)" }}>
                  No emails found
                </div>
              )}
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
