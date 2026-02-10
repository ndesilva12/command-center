"use client";

import { useState, useEffect } from "react";
import { Users, RefreshCw, ExternalLink, Mail, Phone, AlertCircle } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  organization?: string;
  title?: string;
  accountEmail?: string;
  accountName?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setError(null);
      const res = await fetch('/api/contacts');

      if (!res.ok) {
        if (res.status === 401) {
          setError('Please connect a Google account to view contacts');
        } else {
          setError('Failed to fetch contacts');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="contacts" />

      <main style={{ paddingTop: "136px", paddingBottom: "32px", minHeight: "100vh", maxWidth: "1400px", margin: "0 auto", padding: "136px 24px 32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Users style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>Contacts</h1>
            {!loading && !error && (
              <span style={{ fontSize: "14px", color: "var(--foreground-muted)", marginLeft: "4px" }}>
                ({contacts.length})
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href="https://contacts.google.com"
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
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.color = "#00aaff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "var(--foreground-muted)";
              }}
            >
              <ExternalLink style={{ width: "14px", height: "14px" }} />
              Open in Google Contacts
            </a>
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                cursor: loading || refreshing ? "not-allowed" : "pointer",
                fontSize: "13px",
                transition: "all 0.15s ease",
                opacity: loading || refreshing ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading && !refreshing) {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "#00aaff";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "var(--foreground-muted)";
              }}
            >
              <RefreshCw
                style={{
                  width: "14px",
                  height: "14px",
                  animation: refreshing ? "spin 1s linear infinite" : "none"
                }}
              />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center"
          }}>
            <RefreshCw
              style={{
                width: "32px",
                height: "32px",
                color: "#00aaff",
                margin: "0 auto 16px",
                animation: "spin 1s linear infinite"
              }}
            />
            <p style={{ color: "var(--foreground-muted)" }}>Loading contacts...</p>
          </div>
        ) : error ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center"
          }}>
            <AlertCircle style={{ width: "48px", height: "48px", color: "#ff4444", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              {error}
            </h2>
            <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
              {error.includes('connect') ? 'Go to Settings to connect your Google account' : 'Please try again later'}
            </p>
          </div>
        ) : contacts.length === 0 ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center"
          }}>
            <Users style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              No contacts found
            </h2>
            <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
              Your Google Contacts will appear here
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px"
          }}>
            {contacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "20px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  {contact.photo ? (
                    <img
                      src={contact.photo}
                      alt={contact.name}
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid rgba(255, 255, 255, 0.1)"
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(0, 170, 255, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#00aaff",
                      fontSize: "20px",
                      fontWeight: 600,
                      border: "2px solid rgba(0, 170, 255, 0.3)"
                    }}>
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "var(--foreground)",
                      marginBottom: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {contact.name}
                    </h3>
                    {contact.title && (
                      <p style={{
                        fontSize: "12px",
                        color: "var(--foreground-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {contact.title}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {contact.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Mail style={{ width: "14px", height: "14px", color: "#00aaff", flexShrink: 0 }} />
                      <a
                        href={`mailto:${contact.email}`}
                        style={{
                          fontSize: "13px",
                          color: "var(--foreground-muted)",
                          textDecoration: "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#00aaff";
                          e.currentTarget.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--foreground-muted)";
                          e.currentTarget.style.textDecoration = "none";
                        }}
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Phone style={{ width: "14px", height: "14px", color: "#00aaff", flexShrink: 0 }} />
                      <a
                        href={`tel:${contact.phone}`}
                        style={{
                          fontSize: "13px",
                          color: "var(--foreground-muted)",
                          textDecoration: "none"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#00aaff";
                          e.currentTarget.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--foreground-muted)";
                          e.currentTarget.style.textDecoration = "none";
                        }}
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.organization && (
                    <p style={{
                      fontSize: "12px",
                      color: "var(--foreground-muted)",
                      marginTop: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {contact.organization}
                    </p>
                  )}
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
