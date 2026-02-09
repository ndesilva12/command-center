"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  RefreshCw,
  Archive,
  Trash2,
  Star,
  MailOpen,
  MailPlus,
  ExternalLink,
  Search,
  Inbox,
  Send,
  X,
  Reply,
  Forward,
  ChevronDown,
} from "lucide-react";

interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  hasAttachments?: boolean;
}

interface FullEmail extends Email {
  to: string[];
  cc?: string[];
  body: string;
  htmlBody?: string;
  attachments?: any[];
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<FullEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState<"compose" | "reply" | "forward">("compose");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/gmail/messages?maxResults=50");
      const data = await response.json();
      
      setEmails(data.emails || []);
      if (data.accounts) setAccounts(data.accounts);
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEmail = async (email: Email) => {
    try {
      const response = await fetch(`/api/gmail/messages/${email.id}`);
      const data = await response.json();
      setSelectedEmail(data.email);
    } catch (error) {
      console.error("Error opening email:", error);
    }
  };

  const performAction = async (action: string, messageId: string) => {
    try {
      await fetch("/api/gmail/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, messageId }),
      });
      
      // Update local state
      if (action === "archive" || action === "trash") {
        setEmails(emails.filter(e => e.id !== messageId));
        setSelectedEmail(null);
      } else if (action === "read") {
        setEmails(emails.map(e => e.id === messageId ? { ...e, isUnread: false } : e));
      }
    } catch (error) {
      console.error("Error performing action:", error);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else if (diffHours < 168) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const formatSender = (from: string) => {
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim() : from;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--background)",
      color: "var(--foreground)",
      padding: "20px",
    }}>
      {/* Header */}
      <div style={{
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Mail style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>Emails</h1>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => window.open("https://mail.google.com", "_blank")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              color: "var(--foreground)",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <ExternalLink style={{ width: "16px", height: "16px" }} />
            Open in Gmail
          </button>
          
          <button
            onClick={() => {
              setShowCompose(true);
              setComposeMode("compose");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "var(--accent)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <MailPlus style={{ width: "16px", height: "16px" }} />
            Compose
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <div style={{
          flex: 1,
          position: "relative",
        }}>
          <Search style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "18px",
            height: "18px",
            color: "var(--foreground-muted)",
          }} />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 48px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              color: "var(--foreground)",
              fontSize: "14px",
            }}
          />
        </div>
        
        {accounts.length > 1 && (
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            style={{
              padding: "12px 16px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              color: "var(--foreground)",
              fontSize: "14px",
            }}
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.email} value={acc.email}>
                {acc.email}
              </option>
            ))}
          </select>
        )}
        
        <button
          onClick={fetchEmails}
          disabled={loading}
          style={{
            padding: "12px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            color: "var(--foreground)",
            cursor: "pointer",
          }}
        >
          <RefreshCw style={{
            width: "18px",
            height: "18px",
            animation: loading ? "spin 1s linear infinite" : "none",
          }} />
        </button>
      </div>

      {/* Email List */}
      <div style={{
        display: "grid",
        gridTemplateColumns: selectedEmail ? "1fr 1.5fr" : "1fr",
        gap: "20px",
      }}>
        {/* List */}
        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
          ) : emails.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--foreground-muted)" }}>
              No emails found
            </div>
          ) : (
            emails
              .filter(email =>
                !searchQuery ||
                email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                email.from.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((email) => (
                <div
                  key={email.id}
                  onClick={() => openEmail(email)}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    cursor: "pointer",
                    background: selectedEmail?.id === email.id ? "rgba(255, 255, 255, 0.05)" : "transparent",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedEmail?.id !== email.id) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEmail?.id !== email.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: email.isUnread ? 700 : 500,
                      color: email.isUnread ? "var(--foreground)" : "var(--foreground-muted)",
                    }}>
                      {formatSender(email.from)}
                    </span>
                    <span style={{
                      fontSize: "12px",
                      color: "var(--foreground-muted)",
                    }}>
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: email.isUnread ? 600 : 400,
                    marginBottom: "4px",
                  }}>
                    {email.subject}
                  </div>
                  <div style={{
                    fontSize: "13px",
                    color: "var(--foreground-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {email.snippet}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Email Detail */}
        {selectedEmail && (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: "24px",
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                {selectedEmail.subject}
              </h2>
              <button
                onClick={() => setSelectedEmail(null)}
                style={{
                  padding: "8px",
                  background: "transparent",
                  border: "none",
                  color: "var(--foreground-muted)",
                  cursor: "pointer",
                }}
              >
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                <strong>From:</strong> {selectedEmail.from}
              </div>
              <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                <strong>To:</strong> {selectedEmail.to.join(", ")}
              </div>
              {selectedEmail.cc && (
                <div style={{ fontSize: "14px", marginBottom: "8px" }}>
                  <strong>CC:</strong> {selectedEmail.cc.join(", ")}
                </div>
              )}
              <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                {new Date(parseInt(selectedEmail.date)).toLocaleString()}
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "8px",
              marginBottom: "24px",
              paddingBottom: "24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}>
              <button
                onClick={() => {
                  setShowCompose(true);
                  setComposeMode("reply");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Reply style={{ width: "14px", height: "14px" }} />
                Reply
              </button>
              <button
                onClick={() => {
                  setShowCompose(true);
                  setComposeMode("forward");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Forward style={{ width: "14px", height: "14px" }} />
                Forward
              </button>
              <button
                onClick={() => performAction("archive", selectedEmail.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Archive style={{ width: "14px", height: "14px" }} />
                Archive
              </button>
              <button
                onClick={() => {
                  if (confirm("Move to trash?")) {
                    performAction("trash", selectedEmail.id);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: "rgba(255, 0, 0, 0.1)",
                  border: "1px solid rgba(255, 0, 0, 0.2)",
                  borderRadius: "8px",
                  color: "#ff4444",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Trash2 style={{ width: "14px", height: "14px" }} />
                Delete
              </button>
            </div>

            <div style={{
              fontSize: "14px",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {selectedEmail.htmlBody ? (
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />
              ) : (
                selectedEmail.body
              )}
            </div>

            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div style={{
                marginTop: "24px",
                paddingTop: "24px",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}>
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
                  Attachments ({selectedEmail.attachments.length})
                </div>
                {selectedEmail.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    {att.filename}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compose Modal - Placeholder */}
      {showCompose && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCompose(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%",
              maxWidth: "600px",
              background: "var(--background)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {composeMode === "reply" ? "Reply" : composeMode === "forward" ? "Forward" : "Compose Email"}
            </h3>
            <p style={{ color: "var(--foreground-muted)" }}>
              Compose functionality coming soon. Connect your Google account to enable.
            </p>
            <button
              onClick={() => setShowCompose(false)}
              style={{
                padding: "10px 20px",
                background: "var(--accent)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
