'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, MapPin, TrendingUp, ChevronRight, Globe } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  relativeTime: string;
  image?: string;
  isFeatured?: boolean;
}

interface NewsSection {
  id: string;
  label: string;
  items: NewsItem[];
  loading: boolean;
  error: string | null;
}

const LOCAL_SECTIONS = [
  { id: 'wellesley', label: 'Wellesley', icon: MapPin, location: 'Wellesley Massachusetts' },
  { id: 'dartmouth', label: 'Dartmouth', icon: MapPin, location: 'Dartmouth Massachusetts' },
];

export default function NewsHub() {
  const [zeroHedge, setZeroHedge] = useState<{ items: NewsItem[]; loading: boolean; error: string | null }>({
    items: [],
    loading: true,
    error: null
  });
  const [googleNews, setGoogleNews] = useState<{ items: NewsItem[]; loading: boolean; error: string | null }>({
    items: [],
    loading: true,
    error: null
  });
  const [localSections, setLocalSections] = useState<Record<string, NewsSection>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchZeroHedge = async () => {
    setZeroHedge(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/news?feed=zerohedge&limit=6');
      const data = await response.json();
      setZeroHedge({
        items: data.items || [],
        loading: false,
        error: data.error || null
      });
    } catch {
      setZeroHedge({ items: [], loading: false, error: 'Failed to load' });
    }
  };

  const fetchGoogleNews = async () => {
    setGoogleNews(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch('/api/news?feed=top&limit=5');
      const data = await response.json();
      setGoogleNews({
        items: data.items || [],
        loading: false,
        error: data.error || null
      });
    } catch {
      setGoogleNews({ items: [], loading: false, error: 'Failed to load' });
    }
  };

  const fetchLocalSection = async (section: typeof LOCAL_SECTIONS[0]) => {
    setLocalSections(prev => ({
      ...prev,
      [section.id]: {
        ...prev[section.id],
        id: section.id,
        label: section.label,
        items: prev[section.id]?.items || [],
        loading: true,
        error: null
      }
    }));

    try {
      const url = `/api/news?feed=local&location=${encodeURIComponent(section.location)}&limit=4`;
      const response = await fetch(url);
      const data = await response.json();

      setLocalSections(prev => ({
        ...prev,
        [section.id]: {
          ...prev[section.id],
          items: data.items || [],
          loading: false,
          error: data.error || null
        }
      }));
    } catch {
      setLocalSections(prev => ({
        ...prev,
        [section.id]: {
          ...prev[section.id],
          items: [],
          loading: false,
          error: 'Failed to load'
        }
      }));
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchZeroHedge(),
      fetchGoogleNews(),
      ...LOCAL_SECTIONS.map(s => fetchLocalSection(s))
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchZeroHedge();
    fetchGoogleNews();
    LOCAL_SECTIONS.forEach(s => fetchLocalSection(s));
    const interval = setInterval(refreshAll, 600000);
    return () => clearInterval(interval);
  }, []);

  // Split ZeroHedge items into featured (up to 2) and others
  const featuredStories = zeroHedge.items.filter(item => item.isFeatured).slice(0, 2);
  const otherStories = zeroHedge.items.filter(item => !item.isFeatured).slice(0, 4);

  const renderFeaturedCard = (item: NewsItem, isHalf: boolean = false) => {
    return (
      <a
        key={item.link}
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          overflow: "hidden",
          textDecoration: "none",
          transition: "all 0.2s",
          flex: isHalf ? "1" : "none",
          minWidth: isHalf ? "0" : "auto",
          height: "100%"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.3)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {item.image && (
          <div style={{
            width: "100%",
            height: isHalf ? "100px" : "160px",
            backgroundImage: `url(${item.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            flexShrink: 0
          }} />
        )}
        <div style={{ padding: isHalf ? "10px" : "14px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{
            fontSize: isHalf ? "13px" : "16px",
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.95)",
            lineHeight: 1.35,
            marginBottom: "8px",
            display: "-webkit-box",
            WebkitLineClamp: isHalf ? 3 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            flex: 1
          }}>
            {item.title}
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "10px",
            color: "rgba(255, 255, 255, 0.4)"
          }}>
            <span style={{ color: "#f97316", fontWeight: 500 }}>Featured</span>
            {item.relativeTime && item.relativeTime !== 'Featured' && <span>• {item.relativeTime}</span>}
          </div>
        </div>
      </a>
    );
  };

  const renderLocalSection = (sectionId: string) => {
    const section = localSections[sectionId];
    const config = LOCAL_SECTIONS.find(s => s.id === sectionId);
    if (!config) return null;
    const Icon = config.icon;
    const items = section?.items || [];
    const isLoading = section?.loading && !items.length;

    const googleNewsUrl = `https://news.google.com/search?q=${encodeURIComponent(config.location)}&hl=en-US&gl=US&ceid=US:en`;

    return (
      <div style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        overflow: "hidden"
      }}>
        <a
          href={googleNewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background 0.15s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Icon style={{ width: "14px", height: "14px", color: "#3b82f6" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.9)" }}>
              {config.label}
            </span>
          </div>
          <ChevronRight style={{ width: "14px", height: "14px", color: "rgba(255, 255, 255, 0.3)" }} />
        </a>
        
        <div style={{ padding: "8px" }}>
          {isLoading ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <div style={{
                width: "20px",
                height: "20px",
                border: "2px solid #3b82f6",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto"
              }} />
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "rgba(255, 255, 255, 0.3)", fontSize: "12px" }}>
              No recent news
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {items.slice(0, 4).map(item => (
                <a
                  key={item.link}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "transparent",
                    textDecoration: "none",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.85)",
                    lineHeight: 1.4,
                    marginBottom: "4px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.35)" }}>
                    {item.source} {item.relativeTime && `• ${item.relativeTime}`}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Newspaper style={{ width: "20px", height: "20px", color: "#3b82f6" }} />
          <span style={{ fontSize: "18px", fontWeight: 600, color: "rgba(255, 255, 255, 0.95)" }}>News</span>
        </div>
        <button
          onClick={refreshAll}
          disabled={refreshing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "12px",
            cursor: refreshing ? "not-allowed" : "pointer",
            opacity: refreshing ? 0.5 : 1
          }}
        >
          <RefreshCw style={{ 
            width: "14px", 
            height: "14px",
            animation: refreshing ? "spin 1s linear infinite" : "none"
          }} />
          Refresh
        </button>
      </div>

      {/* ZeroHedge Section */}
      <div style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        marginBottom: "16px",
        overflow: "hidden"
      }}>
        {/* ZeroHedge Header */}
        <a
          href="https://www.zerohedge.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background 0.15s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp style={{ width: "14px", height: "14px", color: "#f97316" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.9)" }}>
              ZeroHedge
            </span>
          </div>
          <ChevronRight style={{ width: "14px", height: "14px", color: "rgba(255, 255, 255, 0.3)" }} />
        </a>

        {/* Content */}
        <div style={{ padding: "12px" }}>
          {zeroHedge.loading && !zeroHedge.items.length ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div style={{
                width: "24px",
                height: "24px",
                border: "2px solid #f97316",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto"
              }} />
            </div>
          ) : zeroHedge.items.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "rgba(255, 255, 255, 0.3)", fontSize: "13px" }}>
              Unable to load ZeroHedge feed
            </div>
          ) : isMobile ? (
            /* Mobile: Stack everything vertically */
            <>
              {featuredStories.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: otherStories.length > 0 ? "12px" : "0" }}>
                  {featuredStories.map((item) => renderFeaturedCard(item, false))}
                </div>
              )}
              {otherStories.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {otherStories.map(item => (
                    <a
                      key={item.link}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        padding: "10px",
                        borderRadius: "8px",
                        background: "transparent",
                        textDecoration: "none",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "rgba(255, 255, 255, 0.85)",
                        lineHeight: 1.4,
                        marginBottom: "4px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.35)" }}>
                        {item.relativeTime}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Desktop: Featured left (side-by-side if 2), Other stories right */
            <div style={{
              display: "grid",
              gridTemplateColumns: otherStories.length > 0 ? "1.5fr 1fr" : "1fr",
              gap: "16px"
            }}>
              {/* Left: Featured Stories */}
              {featuredStories.length > 0 && (
                <div style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "12px",
                  minHeight: "220px"
                }}>
                  {featuredStories.map((item) => renderFeaturedCard(item, featuredStories.length === 2))}
                </div>
              )}

              {/* Right: Other Stories */}
              {otherStories.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {otherStories.map(item => (
                    <a
                      key={item.link}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        padding: "12px",
                        borderRadius: "8px",
                        background: "transparent",
                        textDecoration: "none",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "rgba(255, 255, 255, 0.85)",
                        lineHeight: 1.4,
                        marginBottom: "4px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.35)" }}>
                        {item.relativeTime}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Local News Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: "12px",
        marginBottom: "16px"
      }}>
        {renderLocalSection('wellesley')}
        {renderLocalSection('dartmouth')}
      </div>

      {/* Google News Top Stories */}
      <div style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        overflow: "hidden"
      }}>
        <a
          href="https://news.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background 0.15s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Globe style={{ width: "14px", height: "14px", color: "#22c55e" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.9)" }}>
              Google News
            </span>
          </div>
          <ChevronRight style={{ width: "14px", height: "14px", color: "rgba(255, 255, 255, 0.3)" }} />
        </a>
        
        <div style={{ padding: "8px" }}>
          {googleNews.loading && !googleNews.items.length ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <div style={{
                width: "20px",
                height: "20px",
                border: "2px solid #22c55e",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto"
              }} />
            </div>
          ) : googleNews.items.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "rgba(255, 255, 255, 0.3)", fontSize: "12px" }}>
              Unable to load news
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {googleNews.items.map(item => (
                <a
                  key={item.link}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "transparent",
                    textDecoration: "none",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "rgba(255, 255, 255, 0.85)",
                    lineHeight: 1.4,
                    marginBottom: "4px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.35)" }}>
                    {item.source} {item.relativeTime && `• ${item.relativeTime}`}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: "16px", 
        paddingTop: "12px", 
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        display: "flex",
        justifyContent: "center",
        gap: "16px"
      }}>
        <a
          href="https://www.zerohedge.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.3)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          ZeroHedge
          <ExternalLink style={{ width: "10px", height: "10px" }} />
        </a>
        <a
          href="https://news.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.3)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          Google News
          <ExternalLink style={{ width: "10px", height: "10px" }} />
        </a>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
