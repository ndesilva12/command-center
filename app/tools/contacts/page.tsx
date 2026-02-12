"use client";

import { useState, useEffect } from "react";
import { Users, RefreshCw, ExternalLink, Mail, Phone, AlertCircle, Grid, List, Search, X } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";


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
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('contacts', 'Contacts', '#6366f1');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Load view preference from localStorage
    const savedViewMode = localStorage.getItem("contacts_viewMode");
    if (savedViewMode) setViewMode(savedViewMode as "grid" | "list");

    fetchContacts();
  }, []);

  useEffect(() => {
    // Save view preference to localStorage
    localStorage.setItem("contacts_viewMode", viewMode);
  }, [viewMode]);

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

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.phone?.includes(query) ||
      contact.organization?.toLowerCase().includes(query) ||
      contact.title?.toLowerCase().includes(query)
    );
  });

  const displayContacts = filteredContacts;

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="contacts" />

      <main style={{
        paddingTop: isMobile ? "80px" : "136px",
        paddingBottom: isMobile ? "80px" : "32px",
        paddingLeft: isMobile ? "12px" : "24px",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Users style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>{toolCustom.name}</h1>
            {!loading && !error && (
              <span style={{ fontSize: "14px", color: "var(--foreground-muted)", marginLeft: "4px" }}>
                ({searchQuery ? `${displayContacts.length} of ${contacts.length}` : contacts.length})
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* View Toggle */}
            <div style={{ display: "flex", gap: "4px", padding: "4px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px",
                  borderRadius: "6px",
                  backgroundColor: viewMode === "grid" ? "rgba(0, 170, 255, 0.15)" : "transparent",
                  color: viewMode === "grid" ? "#00aaff" : "var(--foreground-muted)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <Grid style={{ width: "16px", height: "16px" }} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px",
                  borderRadius: "6px",
                  backgroundColor: viewMode === "list" ? "rgba(0, 170, 255, 0.15)" : "transparent",
                  color: viewMode === "list" ? "#00aaff" : "var(--foreground-muted)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <List style={{ width: "16px", height: "16px" }} />
              </button>
            </div>

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

        {/* Search Bar */}
        <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", backgroundColor: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <Search style={{ width: "18px", height: "18px", color: "var(--foreground-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, backgroundColor: "transparent", border: "none", outline: "none", color: "var(--foreground)", fontSize: "14px" }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "none",
                cursor: "pointer",
                color: "var(--foreground-muted)",
              }}
            >
              <X style={{ width: "12px", height: "12px" }} />
            </button>
          )}
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
        ) : viewMode === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px"
          }}>
            {displayContacts.map((contact) => (
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
        ) : (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            {contacts.map((contact, index) => (
              <div
                key={contact.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "16px 20px",
                  borderBottom: index < contacts.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {contact.photo ? (
                  <img
                    src={contact.photo}
                    alt={contact.name}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid rgba(255, 255, 255, 0.1)",
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "rgba(0, 170, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#00aaff",
                    fontSize: "16px",
                    fontWeight: 600,
                    border: "2px solid rgba(0, 170, 255, 0.3)",
                    flexShrink: 0
                  }}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ flex: "0 0 200px", minWidth: 0 }}>
                  <h3 style={{
                    fontSize: "15px",
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

                <div style={{ flex: "1 1 auto", display: "flex", alignItems: "center", gap: "24px", fontSize: "13px" }}>
                  {contact.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                      <Mail style={{ width: "14px", height: "14px", color: "#00aaff", flexShrink: 0 }} />
                      <a
                        href={`mailto:${contact.email}`}
                        style={{
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
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Phone style={{ width: "14px", height: "14px", color: "#00aaff", flexShrink: 0 }} />
                      <a
                        href={`tel:${contact.phone}`}
                        style={{
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
