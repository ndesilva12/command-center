'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, MapPin, TrendingUp, ChevronRight } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  relativeTime: string;
}

interface NewsSection {
  id: string;
  label: string;
  items: NewsItem[];
  loading: boolean;
  error: string | null;
}

const SECTIONS = [
  { id: 'top', label: 'Top Stories', icon: TrendingUp, feed: 'top' },
  { id: 'wellesley', label: 'Wellesley', icon: MapPin, feed: 'local', location: 'Wellesley Massachusetts' },
  { id: 'dartmouth', label: 'Dartmouth', icon: MapPin, feed: 'local', location: 'Dartmouth Massachusetts' },
];

export default function NewsHub() {
  const [sections, setSections] = useState<Record<string, NewsSection>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchSection = async (section: typeof SECTIONS[0]) => {
    setSections(prev => ({
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
      let url = '/api/news?limit=8';
      if (section.feed === 'top') {
        url += '&feed=top';
      } else if (section.feed === 'local' && section.location) {
        url += `&feed=local&location=${encodeURIComponent(section.location)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      setSections(prev => ({
        ...prev,
        [section.id]: {
          ...prev[section.id],
          items: data.items || [],
          loading: false,
          error: data.error || null
        }
      }));
    } catch {
      setSections(prev => ({
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
    await Promise.all(SECTIONS.map(s => fetchSection(s)));
    setRefreshing(false);
  };

  useEffect(() => {
    SECTIONS.forEach(s => fetchSection(s));
    const interval = setInterval(refreshAll, 600000);
    return () => clearInterval(interval);
  }, []);

  const topStories = sections['top']?.items || [];
  const featuredStory = topStories[0];
  const secondaryStories = topStories.slice(1, 4);

  const renderNewsCard = (item: NewsItem, size: 'large' | 'medium' | 'small' = 'small') => {
    const isLarge = size === 'large';
    const isMedium = size === 'medium';
    
    return (
      <a
        key={item.link}
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          padding: isLarge ? "20px" : isMedium ? "16px" : "12px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          textDecoration: "none",
          transition: "all 0.2s",
          height: "100%"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div style={{
          fontSize: isLarge ? "18px" : isMedium ? "15px" : "13px",
          fontWeight: isLarge ? 600 : 500,
          color: "rgba(255, 255, 255, 0.95)",
          lineHeight: 1.4,
          marginBottom: isLarge ? "12px" : "8px",
          display: "-webkit-box",
          WebkitLineClamp: isLarge ? 3 : 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {item.title}
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "rgba(255, 255, 255, 0.4)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ 
              color: "#3b82f6", 
              fontWeight: 500,
              maxWidth: "120px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
              {item.source}
            </span>
            {item.relativeTime && <span>• {item.relativeTime}</span>}
          </div>
          <ExternalLink style={{ width: "12px", height: "12px", opacity: 0.5 }} />
        </div>
      </a>
    );
  };

  const renderLocalSection = (sectionId: string) => {
    const section = sections[sectionId];
    const config = SECTIONS.find(s => s.id === sectionId);
    if (!config) return null;
    const Icon = config.icon;
    const items = section?.items || [];
    const isLoading = section?.loading && !items.length;

    return (
      <div style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        overflow: "hidden"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Icon style={{ width: "14px", height: "14px", color: "#3b82f6" }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255, 255, 255, 0.9)" }}>
              {config.label}
            </span>
          </div>
          <ChevronRight style={{ width: "14px", height: "14px", color: "rgba(255, 255, 255, 0.3)" }} />
        </div>
        
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
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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

      {/* Featured + Secondary Stories Grid */}
      {!isMobile && featuredStory && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: "16px",
          marginBottom: "20px"
        }}>
          {/* Featured Story */}
          <div>
            {renderNewsCard(featuredStory, 'large')}
          </div>
          
          {/* Secondary Stories */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {secondaryStories.map(item => renderNewsCard(item, 'medium'))}
          </div>
        </div>
      )}

      {/* Mobile: Just show top stories in a list */}
      {isMobile && topStories.length > 0 && (
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "10px",
          marginBottom: "20px"
        }}>
          {topStories.slice(0, 4).map(item => renderNewsCard(item, 'small'))}
        </div>
      )}

      {/* Local News Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: "12px"
      }}>
        {renderLocalSection('wellesley')}
        {renderLocalSection('dartmouth')}
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: "16px", 
        paddingTop: "12px", 
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        display: "flex",
        justifyContent: "center"
      }}>
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
          Powered by Google News
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
