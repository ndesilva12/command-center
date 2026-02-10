"use client";

import { useState, useEffect } from "react";
import { Mail, RefreshCw, Archive, Trash2, Search, X, ExternalLink, Plus, Users, UserPlus, ChevronDown, Inbox, Send, FileEdit } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { formatEmailSender, getSuperhumanUrl } from "@/lib/gmail";

type EmailFolder = "inbox" | "sent" | "drafts" | "archived" | "trash";

const FOLDER_CONFIG: Record<EmailFolder, { label: string; icon: typeof Inbox; query: string }> = {
  inbox: { label: "Inbox", icon: Inbox, query: "in:inbox" },
  sent: { label: "Sent", icon: Send, query: "in:sent" },
  drafts: { label: "Drafts", icon: FileEdit, query: "in:drafts" },
  archived: { label: "Archived", icon: Archive, query: "-in:inbox -in:spam -in:trash" },
  trash: { label: "Trash", icon: Trash2, query: "in:trash" },
};

interface EmailWithAccount {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isUnread: boolean;
  accountEmail?: string;
  accountName?: string;
}

interface AccountInfo {
  email: string;
  name?: string;
  picture?: string;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailWithAccount[]>([]);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder>("inbox");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ emailId: string; accountEmail?: string; subject: string } | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailWithAccount | null>(null);
  const [emailBody, setEmailBody] = useState<string>("");
  const [emailBodyText, setEmailBodyText] = useState<string>("");
  const [loadingEmailBody, setLoadingEmailBody] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [emailViewMode, setEmailViewMode] = useState<"html" | "text">("html");

  // Load email view preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("email-view-mode");
    if (savedMode === "html" || savedMode === "text") {
      setEmailViewMode(savedMode);
    }
  }, []);

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isConnected) {
      fetchEmails();
    }
  }, [selectedAccount, selectedFolder, isConnected, debouncedSearch]);

  // Handle Enter key for delete confirmation
  useEffect(() => {
    if (!deleteConfirm) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmDelete();
      } else if (e.key === "Escape") {
        setDeleteConfirm(null);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteConfirm]);

  const checkConnectionAndFetch = async () => {
    try {
      const accountsResponse = await fetch("/api/auth/google/accounts");
      const accountsData = await accountsResponse.json();

      if (accountsData.connected && accountsData.accounts.length > 0) {
        setIsConnected(true);
        setAccounts(accountsData.accounts);
        setSelectedAccount("all");
      } else {
        const statusResponse = await fetch("/api/auth/google/status");
        const status = await statusResponse.json();
        setIsConnected(status.connected);
        if (!status.connected) {
          setLoading(false);
        }
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (selectedAccount === "all") {
        params.set("all", "true");
      } else {
        params.set("account", selectedAccount);
      }
      
      const folderQuery = FOLDER_CONFIG[selectedFolder].query;
      if (debouncedSearch.trim()) {
        params.set("q", `${folderQuery} ${debouncedSearch.trim()}`);
      } else {
        params.set("q", folderQuery);
      }

      const response = await fetch(`/api/gmail?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch emails");
      
      const data = await response.json();
      setEmails(data.emails || []);
      if (data.accounts) setAccounts(data.accounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const returnUrl = encodeURIComponent("/tools/emails");
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}`);
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  };

  const handleAddAccount = async () => {
    try {
      const returnUrl = encodeURIComponent("/tools/emails");
      const response = await fetch(`/api/auth/google?returnUrl=${returnUrl}&addAccount=true`);
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Failed to add account:", err);
    }
  };

  const handleRemoveAccount = async (email: string) => {
    if (!confirm(`Remove ${email} from connected accounts?`)) return;

    try {
      const response = await fetch(`/api/auth/google/accounts?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        if (data.remainingAccounts === 0) {
          setIsConnected(false);
          setAccounts([]);
          setEmails([]);
        } else {
          setAccounts((prev) => prev.filter((a) => a.email !== email));
          if (selectedAccount === email) setSelectedAccount("all");
        }
      }
    } catch (err) {
      console.error("Failed to remove account:", err);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    if (isYesterday) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleArchiveEmail = async (e: React.MouseEvent, email: EmailWithAccount) => {
    e.stopPropagation();
    const accountEmail = email.accountEmail || (selectedAccount !== "all" ? selectedAccount : undefined);

    try {
      const response = await fetch(`/api/gmail/${email.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive",
          account: accountEmail,
        }),
      });

      if (response.ok) {
        setEmails((prev) => prev.filter((e) => e.id !== email.id));
      }
    } catch (err) {
      console.error("Failed to archive email:", err);
    }
  };

  const handleDeleteEmail = async (e: React.MouseEvent, email: EmailWithAccount) => {
    e.stopPropagation();
    setDeleteConfirm({
      emailId: email.id,
      accountEmail: email.accountEmail || (selectedAccount !== "all" ? selectedAccount : undefined),
      subject: email.subject || "this email",
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await fetch(`/api/gmail/${deleteConfirm.emailId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trash",
          account: deleteConfirm.accountEmail,
        }),
      });

      if (response.ok) {
        setEmails((prev) => prev.filter((e) => e.id !== deleteConfirm.emailId));
      }
    } catch (err) {
      console.error("Failed to delete email:", err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleEmailViewMode = () => {
    const newMode = emailViewMode === "html" ? "text" : "html";
    setEmailViewMode(newMode);
    localStorage.setItem("email-view-mode", newMode);
  };

  const handleViewEmail = async (email: EmailWithAccount) => {
    setSelectedEmail(email);
    setLoadingEmailBody(true);
    setEmailBody("");
    setEmailBodyText("");

    try {
      const accountParam = email.accountEmail || (selectedAccount !== "all" ? selectedAccount : undefined);
      const params = new URLSearchParams({ id: email.id });
      if (accountParam) params.set("account", accountParam);

      const response = await fetch(`/api/gmail/message?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch email");

      const data = await response.json();
      setEmailBody(data.body || data.snippet || "No content available");
      setEmailBodyText(data.textBody || data.snippet || "No content available");

      // Mark as read if unread
      if (email.isUnread) {
        try {
          await fetch(`/api/gmail/${email.id}/actions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "markAsRead",
              account: accountParam,
            }),
          });
          
          // Update local state
          setEmails((prev) =>
            prev.map((e) => (e.id === email.id ? { ...e, isUnread: false } : e))
          );
          setSelectedEmail({ ...email, isUnread: false });
        } catch (err) {
          console.error("Failed to mark as read:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load email body:", err);
      setEmailBody("Failed to load email content");
    } finally {
      setLoadingEmailBody(false);
    }
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) return;

    setSending(true);
    try {
      const accountParam = selectedAccount !== "all" ? selectedAccount : accounts[0]?.email;

      const response = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo,
          subject: composeSubject,
          body: composeBody,
          account: accountParam,
        }),
      });

      if (response.ok) {
        setShowCompose(false);
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        // Refresh inbox after sending
        fetchEmails();
      } else {
        throw new Error("Failed to send email");
      }
    } catch (err) {
      console.error("Failed to send email:", err);
      alert("Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="emails" />

      {/* View Email Modal */}
      {selectedEmail && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            backdropFilter: "blur(4px)",
            padding: "20px",
          }}
          onClick={() => setSelectedEmail(null)}
        >
          <div
            style={{
              background: "rgba(10, 10, 10, 0.98)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "0",
              borderRadius: "16px",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px", lineHeight: 1.4 }}>
                  {selectedEmail.subject || "(No Subject)"}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                  <div><strong>From:</strong> {formatEmailSender(selectedEmail.from)}</div>
                  <div><strong>Date:</strong> {new Date(parseInt(selectedEmail.date)).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: "16px" }}>
                {/* HTML/Text Toggle */}
                <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "6px", backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                  <button
                    onClick={toggleEmailViewMode}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: emailViewMode === "html" ? "rgba(0, 170, 255, 0.2)" : "transparent",
                      color: emailViewMode === "html" ? "#00aaff" : "var(--foreground-muted)",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    HTML
                  </button>
                  <button
                    onClick={toggleEmailViewMode}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: emailViewMode === "text" ? "rgba(0, 170, 255, 0.2)" : "transparent",
                      color: emailViewMode === "text" ? "#00aaff" : "var(--foreground-muted)",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    Text
                  </button>
                </div>
                <button
                  onClick={() => setSelectedEmail(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--foreground-muted)",
                  }}
                >
                  <X style={{ width: "18px", height: "18px" }} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {loadingEmailBody ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
                  <RefreshCw style={{ width: "32px", height: "32px", color: "#00aaff", animation: "spin 1s linear infinite" }} />
                </div>
              ) : emailViewMode === "html" ? (
                <div
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "var(--foreground)",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: emailBody }}
                />
              ) : (
                <div
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "var(--foreground)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "monospace",
                  }}
                >
                  {emailBodyText}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <a
                href={getSuperhumanUrl(selectedEmail.threadId)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#00aaff",
                  color: "#000",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                <ExternalLink style={{ width: "14px", height: "14px" }} />
                Open in Superhuman
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Compose Email Modal */}
      {showCompose && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            backdropFilter: "blur(4px)",
            padding: "20px",
          }}
          onClick={() => setShowCompose(false)}
        >
          <div
            style={{
              background: "rgba(10, 10, 10, 0.98)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "0",
              borderRadius: "16px",
              maxWidth: "700px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)" }}>
                Compose Email
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--foreground-muted)",
                }}
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground)", marginBottom: "8px" }}>
                    To
                  </label>
                  <input
                    type="email"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="recipient@example.com"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground)", marginBottom: "8px" }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Email subject"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground)", marginBottom: "8px" }}>
                    Message
                  </label>
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Write your message..."
                    rows={12}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      fontSize: "14px",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                      lineHeight: 1.5,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowCompose(false)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "transparent",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!composeTo || !composeSubject || !composeBody || sending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: (!composeTo || !composeSubject || !composeBody || sending) ? "rgba(0, 170, 255, 0.3)" : "#00aaff",
                  color: "#000",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: (!composeTo || !composeSubject || !composeBody || sending) ? "not-allowed" : "pointer",
                  opacity: (!composeTo || !composeSubject || !composeBody || sending) ? 0.5 : 1,
                }}
              >
                {sending ? (
                  <>
                    <RefreshCw style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send style={{ width: "14px", height: "14px" }} />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{
              background: "rgba(10, 10, 10, 0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "24px",
              borderRadius: "12px",
              maxWidth: "400px",
              width: "90%",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 style={{ width: "32px", height: "32px", color: "#ef4444", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              Delete Email?
            </h3>
            <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "20px", lineHeight: 1.5 }}>
              Are you sure you want to delete "{deleteConfirm.subject.length > 50 ? deleteConfirm.subject.substring(0, 50) + "..." : deleteConfirm.subject}"?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "transparent",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#ef4444",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Mail style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>Emails</h1>
          </div>
          
          {isConnected && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <a
                href="https://mail.superhuman.com"
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
                Open in Superhuman
              </a>
              
              {/* Account Selector */}
              {accounts.length > 0 && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      cursor: "pointer",
                      fontSize: "13px",
                      minWidth: "140px",
                    }}
                  >
                    {selectedAccount === "all" ? (
                      <>
                        <Users style={{ width: "14px", height: "14px", color: "#00aaff" }} />
                        <span>All Accounts</span>
                      </>
                    ) : (
                      <>
                        <Mail style={{ width: "14px", height: "14px" }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>
                          {accounts.find(a => a.email === selectedAccount)?.name || selectedAccount}
                        </span>
                      </>
                    )}
                    <ChevronDown style={{ width: "14px", height: "14px", marginLeft: "auto" }} />
                  </button>

                  {showAccountMenu && (
                    <>
                      <div
                        style={{ position: "fixed", inset: 0, zIndex: 40 }}
                        onClick={() => setShowAccountMenu(false)}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          marginTop: "4px",
                          backgroundColor: "rgba(10, 10, 10, 0.95)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                          padding: "4px",
                          minWidth: "220px",
                          zIndex: 50,
                        }}
                      >
                        <button
                          onClick={() => {
                            setSelectedAccount("all");
                            setShowAccountMenu(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            backgroundColor: selectedAccount === "all" ? "rgba(0, 170, 255, 0.1)" : "transparent",
                            color: "var(--foreground)",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            textAlign: "left",
                          }}
                        >
                          <Users style={{ width: "16px", height: "16px", color: "#00aaff" }} />
                          <span style={{ flex: 1 }}>All Accounts</span>
                          {selectedAccount === "all" && <span style={{ color: "#00aaff" }}>✓</span>}
                        </button>

                        <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "4px 0" }} />

                        {accounts.map((account) => (
                          <div
                            key={account.email}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              backgroundColor: selectedAccount === account.email ? "rgba(0, 170, 255, 0.1)" : "transparent",
                            }}
                          >
                            <button
                              onClick={() => {
                                setSelectedAccount(account.email);
                                setShowAccountMenu(false);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flex: 1,
                                padding: "4px 0",
                                backgroundColor: "transparent",
                                color: "var(--foreground)",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "13px",
                                textAlign: "left",
                              }}
                            >
                              {account.picture ? (
                                <img src={account.picture} alt="" style={{ width: "20px", height: "20px", borderRadius: "50%" }} />
                              ) : (
                                <Mail style={{ width: "16px", height: "16px" }} />
                              )}
                              <div style={{ flex: 1, overflow: "hidden" }}>
                                <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {account.name || account.email.split("@")[0]}
                                </div>
                                <div style={{ fontSize: "11px", color: "var(--foreground-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {account.email}
                                </div>
                              </div>
                              {selectedAccount === account.email && <span style={{ color: "#00aaff" }}>✓</span>}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAccount(account.email);
                              }}
                              style={{
                                padding: "4px",
                                backgroundColor: "transparent",
                                color: "var(--foreground-muted)",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "4px",
                              }}
                            >
                              <X style={{ width: "14px", height: "14px" }} />
                            </button>
                          </div>
                        ))}

                        <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.1)", margin: "4px 0" }} />

                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            handleAddAccount();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            backgroundColor: "transparent",
                            color: "#00aaff",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            textAlign: "left",
                          }}
                        >
                          <UserPlus style={{ width: "16px", height: "16px" }} />
                          <span>Add Another Account</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={fetchEmails}
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
                }}
              >
                <RefreshCw style={{ width: "14px", height: "14px", animation: loading ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </button>
              
              <button
                onClick={() => setShowCompose(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#00aaff",
                  color: "#000",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                <Plus style={{ width: "14px", height: "14px" }} />
                Compose
              </button>
            </div>
          )}
        </div>

        {/* Folder Tabs */}
        {isConnected && (
          <div style={{ display: "flex", gap: "4px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
            {(Object.keys(FOLDER_CONFIG) as EmailFolder[]).map((folder) => {
              const config = FOLDER_CONFIG[folder];
              const FolderIcon = config.icon;
              const isActive = selectedFolder === folder;
              return (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    backgroundColor: isActive ? "rgba(0, 170, 255, 0.15)" : "rgba(255, 255, 255, 0.03)",
                    color: isActive ? "#00aaff" : "var(--foreground-muted)",
                    border: isActive ? "1px solid rgba(0, 170, 255, 0.3)" : "1px solid transparent",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: isActive ? 500 : 400,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  <FolderIcon style={{ width: "14px", height: "14px" }} />
                  {config.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Search Bar */}
        {isConnected && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <Search style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "14px" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "rgba(255, 255, 255, 0.1)", border: "none", cursor: "pointer", color: "var(--foreground-muted)" }}>
                  <X style={{ width: "12px", height: "12px" }} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", overflow: "hidden" }}>
          {!isConnected ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <Mail style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Connect Gmail
              </h2>
              <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
                View your recent emails and open them in Superhuman
              </p>
              <button
                onClick={handleConnect}
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  backgroundColor: "#00aaff",
                  color: "#000",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Connect Google
              </button>
            </div>
          ) : loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px" }}>
              <RefreshCw style={{ width: "32px", height: "32px", color: "#00aaff", animation: "spin 1s linear infinite" }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#f87171" }}>
              <p>{error}</p>
              <button onClick={fetchEmails} style={{ marginTop: "16px", padding: "8px 16px", borderRadius: "6px", backgroundColor: "rgba(255, 255, 255, 0.1)", color: "var(--foreground)", border: "none", cursor: "pointer" }}>
                Try Again
              </button>
            </div>
          ) : emails.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--foreground-muted)" }}>
              No emails found
            </div>
          ) : (
            <div>
              {emails.map((email, index) => (
                <div
                  key={email.id}
                  onClick={() => handleViewEmail(email)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "16px 20px",
                    borderTop: "none",
                    borderRight: "none",
                    borderBottom: index < emails.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    borderLeft: email.isUnread ? "4px solid #00aaff" : "4px solid transparent",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "14px", color: email.isUnread ? "var(--foreground)" : "var(--foreground-muted)", fontWeight: email.isUnread ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {formatEmailSender(email.from)}
                      </span>
                      {selectedAccount === "all" && accounts.length > 1 && email.accountEmail && (
                        <span style={{ fontSize: "11px", color: "#00aaff", backgroundColor: "rgba(0, 170, 255, 0.1)", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {email.accountName || email.accountEmail.split("@")[0]}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                        {formatDate(email.date)}
                      </span>
                      <a
                        href={getSuperhumanUrl(email.threadId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "4px", backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--foreground-muted)", transition: "all 0.15s" }}
                      >
                        <ExternalLink style={{ width: "12px", height: "12px" }} />
                      </a>
                      <button
                        onClick={(e) => handleArchiveEmail(e, email)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "4px", backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--foreground-muted)", border: "none", cursor: "pointer", transition: "all 0.15s" }}
                      >
                        <Archive style={{ width: "12px", height: "12px" }} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteEmail(e, email)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "4px", backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--foreground-muted)", border: "none", cursor: "pointer", transition: "all 0.15s" }}
                      >
                        <Trash2 style={{ width: "12px", height: "12px" }} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: "15px", color: email.isUnread ? "var(--foreground)" : "var(--foreground-muted)", fontWeight: email.isUnread ? 500 : 400, lineHeight: 1.4 }}>
                    {email.subject}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--foreground-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", opacity: 0.7 }}>
                    {email.snippet}
                  </div>
                </div>
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
