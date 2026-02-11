"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Search,
  User,
  Target,
  Loader2,
  Mail,
  Phone,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  FileText,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { SearchType, ContactResult, ContactMethod, DISCLAIMER } from "@/lib/types/contact-finder";

// Icon mapping for contact types
const CONTACT_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  phone: Phone,
  x: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  website: Globe,
  form: FileText,
  other: Globe,
};

// Confidence color mapping
const CONFIDENCE_COLORS: Record<string, string> = {
  high: "#22c55e",
  medium: "#eab308",
  low: "#f97316",
  speculative: "#ef4444",
};

export default function ContactFinderPage() {
  return (
    <ProtectedRoute>
      <ContactFinderContent />
    </ProtectedRoute>
  );
}

function ContactFinderContent() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("individual");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ContactResult[]>([]);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setResults([]);
    setSummary("");

    try {
      const response = await fetch("/api/contact-finder/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          searchType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Search failed");
      }

      setResults(data.results || []);
      setSummary(data.summary || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const getContactLink = (contact: ContactMethod) => {
    switch (contact.type) {
      case "email":
        return `mailto:${contact.value}`;
      case "phone":
        return `tel:${contact.value}`;
      case "x":
        return contact.value.startsWith("http") ? contact.value : `https://x.com/${contact.value.replace("@", "")}`;
      case "instagram":
        return contact.value.startsWith("http") ? contact.value : `https://instagram.com/${contact.value.replace("@", "")}`;
      case "facebook":
        return contact.value.startsWith("http") ? contact.value : `https://facebook.com/${contact.value}`;
      case "linkedin":
        return contact.value.startsWith("http") ? contact.value : `https://linkedin.com/in/${contact.value}`;
      case "website":
      case "form":
        return contact.value.startsWith("http") ? contact.value : `https://${contact.value}`;
      default:
        return contact.value.startsWith("http") ? contact.value : undefined;
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="contact-finder" />
      <main
        style={{
          paddingTop: isMobile ? "80px" : "136px",
          paddingBottom: isMobile ? "80px" : "32px",
          paddingLeft: isMobile ? "12px" : "24px",
          paddingRight: isMobile ? "12px" : "24px",
          minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Search style={{ width: "32px", height: "32px", color: "#06b6d4" }} />
            <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              Contact Finder
            </h1>
          </div>
          <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
            Find contact information for individuals and organizations using public sources
          </p>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            padding: "16px",
            background: "rgba(234, 179, 8, 0.1)",
            border: "1px solid rgba(234, 179, 8, 0.3)",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <AlertCircle style={{ width: "20px", height: "20px", color: "#eab308", flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "13px", color: "var(--foreground-muted)", whiteSpace: "pre-line" }}>
              {DISCLAIMER}
            </div>
          </div>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          {/* Search Type Selector */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
              Search Type
            </label>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setSearchType("individual")}
                style={{
                  padding: "16px",
                  background: searchType === "individual" ? "rgba(6, 182, 212, 0.1)" : "rgba(255, 255, 255, 0.02)",
                  border: `1px solid ${searchType === "individual" ? "#06b6d4" : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <User style={{ width: "20px", height: "20px", color: searchType === "individual" ? "#06b6d4" : "var(--foreground-muted)" }} />
                  <span style={{ fontSize: "16px", fontWeight: 600, color: searchType === "individual" ? "#06b6d4" : "var(--foreground)" }}>
                    Individual
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)", margin: 0 }}>
                  Find contact info for a specific person
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSearchType("target")}
                style={{
                  padding: "16px",
                  background: searchType === "target" ? "rgba(6, 182, 212, 0.1)" : "rgba(255, 255, 255, 0.02)",
                  border: `1px solid ${searchType === "target" ? "#06b6d4" : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <Target style={{ width: "20px", height: "20px", color: searchType === "target" ? "#06b6d4" : "var(--foreground-muted)" }} />
                  <span style={{ fontSize: "16px", fontWeight: 600, color: searchType === "target" ? "#06b6d4" : "var(--foreground)" }}>
                    Organization
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)", margin: 0 }}>
                  Find key people at a company/org
                </p>
              </button>
            </div>
          </div>

          {/* Query Input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              {searchType === "individual" ? "Person Name & Context" : "Organization Name"}
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                searchType === "individual"
                  ? "e.g., John Smith, CEO of Acme Inc"
                  : "e.g., Acme Corporation"
              }
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "var(--foreground)",
                fontSize: "14px",
              }}
            />
            <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "6px" }}>
              {searchType === "individual"
                ? "Include job title and company for better results"
                : "Company or organization name"}
            </p>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "14px",
              background: isSearching || !query.trim()
                ? "rgba(6, 182, 212, 0.3)"
                : "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
              border: "none",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isSearching || !query.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isSearching ? (
              <>
                <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                Searching...
              </>
            ) : (
              <>
                <Search style={{ width: "18px", height: "18px" }} />
                Search
              </>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "16px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              color: "#ef4444",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div
            style={{
              padding: "16px",
              background: "rgba(6, 182, 212, 0.1)",
              border: "1px solid rgba(6, 182, 212, 0.3)",
              borderRadius: "8px",
              color: "var(--foreground-muted)",
              fontSize: "14px",
              marginBottom: "24px",
            }}
          >
            {summary}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
              Results ({results.length})
            </h2>
            <div style={{ display: "grid", gap: "24px" }}>
              {results.map((result, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "24px",
                  }}
                >
                  {/* Person Header */}
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "6px" }}>
                      {result.name}
                    </h3>
                    {result.title && (
                      <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
                        {result.title}
                      </p>
                    )}
                    {result.organization && (
                      <p style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                        {result.organization}
                      </p>
                    )}
                  </div>

                  {/* Contact Methods */}
                  {result.contacts && result.contacts.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                        Contact Methods
                      </h4>
                      <div style={{ display: "grid", gap: "12px" }}>
                        {result.contacts.map((contact, contactIdx) => {
                          const Icon = CONTACT_ICONS[contact.type] || Globe;
                          const link = getContactLink(contact);

                          return (
                            <div
                              key={contactIdx}
                              style={{
                                padding: "12px 16px",
                                background: "rgba(255, 255, 255, 0.02)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  background: "rgba(255, 255, 255, 0.05)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <Icon style={{ width: "18px", height: "18px", color: "#06b6d4" }} />
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "var(--foreground-muted)" }}>
                                    {contact.type}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      background: `${CONFIDENCE_COLORS[contact.confidence]}20`,
                                      color: CONFIDENCE_COLORS[contact.confidence],
                                      fontWeight: 500,
                                    }}
                                  >
                                    {contact.confidence}
                                  </span>
                                </div>

                                <div style={{ fontSize: "14px", color: "var(--foreground)", marginBottom: "6px", wordBreak: "break-all" }}>
                                  {link ? (
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: "#06b6d4", textDecoration: "none" }}
                                    >
                                      {contact.value}
                                      <ExternalLink style={{ width: "12px", height: "12px", display: "inline", marginLeft: "4px" }} />
                                    </a>
                                  ) : (
                                    contact.value
                                  )}
                                </div>

                                {(contact.source || contact.notes) && (
                                  <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "6px" }}>
                                    {contact.source && `Source: ${contact.source}`}
                                    {contact.source && contact.notes && " • "}
                                    {contact.notes}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => handleCopy(contact.value)}
                                style={{
                                  padding: "8px",
                                  background: "rgba(255, 255, 255, 0.05)",
                                  border: "1px solid rgba(255, 255, 255, 0.1)",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                }}
                              >
                                {copiedValue === contact.value ? (
                                  <Check style={{ width: "16px", height: "16px", color: "#22c55e" }} />
                                ) : (
                                  <Copy style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Personalization Hooks */}
                  {result.personalizationHooks && result.personalizationHooks.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                        Personalization Hooks
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: "20px" }}>
                        {result.personalizationHooks.map((hook, hookIdx) => (
                          <li key={hookIdx} style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "6px" }}>
                            {hook}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reasoning */}
                  {result.reasoning && (
                    <div
                      style={{
                        padding: "12px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "var(--foreground-muted)",
                        marginBottom: "12px",
                      }}
                    >
                      <strong>Research Notes:</strong> {result.reasoning}
                    </div>
                  )}

                  {/* Additional Notes */}
                  {result.additionalNotes && (
                    <div
                      style={{
                        padding: "12px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "var(--foreground-muted)",
                      }}
                    >
                      {result.additionalNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
