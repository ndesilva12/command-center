"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Store, Search, Loader2, MapPin, Building2, FileText, Phone, Globe, Mail, Calendar } from "lucide-react";
import { BusinessSearchResult, BusinessAnalysis } from "@/lib/types/business";

// US States for dropdown
const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "Washington DC" },
];

export default function BusinessInfoPage() {
  return (
    <ProtectedRoute>
      <BusinessInfoContent />
    </ProtectedRoute>
  );
}

function BusinessInfoContent() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [searchResults, setSearchResults] = useState<BusinessSearchResult[] | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessSearchResult | null>(null);
  const [businessDetails, setBusinessDetails] = useState<BusinessAnalysis | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !city.trim() || !state) return;

    setIsSearching(true);
    setError(null);
    setSearchResults(null);
    setSelectedBusiness(null);
    setBusinessDetails(null);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        city: city.trim(),
        state,
      });

      const response = await fetch(`/api/business-info/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Search failed");
      }

      setSearchResults(data.results);
      setCached(data.cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBusiness = async (business: BusinessSearchResult) => {
    setSelectedBusiness(business);
    setIsLoadingDetails(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        name: business.name,
        address: business.address,
        city: business.city,
        state: business.state,
      });

      const response = await fetch(`/api/business-info/analyze?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to get details");
      }

      setBusinessDetails(data.data);
      setCached(data.cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleReset = () => {
    setSearchResults(null);
    setSelectedBusiness(null);
    setBusinessDetails(null);
    setError(null);
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="business-info" />
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
            <Store style={{ width: "32px", height: "32px", color: "#f59e0b" }} />
            <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              Business Info
            </h1>
          </div>
          <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
            Research local businesses with AI-powered public records search
          </p>
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
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Business Name
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Joe's Pizza"
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
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., San Francisco"
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
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                }}
              >
                <option value="">Select state...</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="submit"
              disabled={isSearching || !query.trim() || !city.trim() || !state}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: isSearching || !query.trim() || !city.trim() || !state
                  ? "rgba(245, 158, 11, 0.3)"
                  : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isSearching || !query.trim() || !city.trim() || !state ? "not-allowed" : "pointer",
              }}
            >
              {isSearching ? (
                <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
              ) : (
                <Search style={{ width: "16px", height: "16px" }} />
              )}
              {isSearching ? "Searching..." : "Search"}
            </button>

            {searchResults && (
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: "12px 24px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                New Search
              </button>
            )}
          </div>

          {cached && (
            <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--foreground-muted)" }}>
              ✓ Loaded from cache
            </div>
          )}
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

        {/* Search Results */}
        {searchResults && !selectedBusiness && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
              Search Results ({searchResults.length})
            </h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {searchResults.map((business, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectBusiness(business)}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "20px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                        {business.name}
                      </h3>
                      {business.type && (
                        <span
                          style={{
                            fontSize: "12px",
                            padding: "4px 8px",
                            background: "rgba(245, 158, 11, 0.1)",
                            color: "#f59e0b",
                            borderRadius: "4px",
                          }}
                        >
                          {business.type}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                      {business.confidence}% match
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>
                    <MapPin style={{ width: "14px", height: "14px" }} />
                    {business.address}, {business.city}, {business.state}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Business Details */}
        {isLoadingDetails && (
          <div style={{ display: "flex", justifyContent: "center", padding: "64px" }}>
            <Loader2 style={{ width: "32px", height: "32px", color: "#f59e0b", animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {businessDetails && (
          <div>
            <button
              onClick={() => {
                setSelectedBusiness(null);
                setBusinessDetails(null);
              }}
              style={{
                marginBottom: "16px",
                padding: "8px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                color: "var(--foreground-muted)",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              ← Back to results
            </button>

            {/* Business Header */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)", marginBottom: "8px" }}>
                {businessDetails.businessName}
              </h2>
              {businessDetails.tradeName && (
                <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
                  DBA: {businessDetails.tradeName}
                </p>
              )}

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                {businessDetails.address && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>
                    <MapPin style={{ width: "16px", height: "16px" }} />
                    {businessDetails.address}, {businessDetails.city}, {businessDetails.state} {businessDetails.zipCode}
                  </div>
                )}
                {businessDetails.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>
                    <Phone style={{ width: "16px", height: "16px" }} />
                    {businessDetails.phone}
                  </div>
                )}
                {businessDetails.website && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                    <Globe style={{ width: "16px", height: "16px", color: "var(--foreground-muted)" }} />
                    <a href={businessDetails.website} target="_blank" rel="noopener noreferrer" style={{ color: "#f59e0b" }}>
                      {businessDetails.website}
                    </a>
                  </div>
                )}
                {businessDetails.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--foreground-muted)" }}>
                    <Mail style={{ width: "16px", height: "16px" }} />
                    {businessDetails.email}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#f59e0b",
                    borderRadius: "6px",
                  }}
                >
                  {businessDetails.businessType}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    borderRadius: "6px",
                  }}
                >
                  {businessDetails.industry}
                </span>
                {businessDetails.yearEstablished && (
                  <span
                    style={{
                      fontSize: "12px",
                      padding: "6px 12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "var(--foreground-muted)",
                      borderRadius: "6px",
                    }}
                  >
                    Est. {businessDetails.yearEstablished}
                  </span>
                )}
              </div>
            </div>

            {/* Summary */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                Summary
              </h3>
              <p style={{ fontSize: "14px", color: "var(--foreground-muted)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {businessDetails.summary}
              </p>
            </div>

            {/* Owners */}
            {businessDetails.owners && businessDetails.owners.length > 0 && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                  Ownership & Leadership
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {businessDetails.owners.map((owner, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                        {owner.name}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                        {owner.title} {owner.ownership && `• ${owner.ownership}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filings */}
            {businessDetails.filings && businessDetails.filings.length > 0 && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                  <FileText style={{ width: "18px", height: "18px", display: "inline", marginRight: "8px" }} />
                  Public Filings
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {businessDetails.filings.map((filing, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                        {filing.type}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                        {filing.agency} • {filing.date} {filing.status && `• ${filing.status}`}
                        {filing.documentNumber && <span> • #{filing.documentNumber}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Licenses */}
            {businessDetails.licenses && businessDetails.licenses.length > 0 && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                  Licenses & Permits
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {businessDetails.licenses.map((license, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                        {license.type}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                        Issued by {license.issuedBy} • {license.status}
                        {license.expirationDate && ` • Expires ${license.expirationDate}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* News */}
            {businessDetails.newsArticles && businessDetails.newsArticles.length > 0 && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
                  News & Media
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {businessDetails.newsArticles.map((article, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        background: "rgba(255, 255, 255, 0.02)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                        {article.title}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "6px" }}>
                        {article.source} • {article.date}
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                        {article.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
