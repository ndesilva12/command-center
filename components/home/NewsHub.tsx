'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, RefreshCw, MapPin, TrendingUp, Briefcase, Cpu, Trophy, Globe } from 'lucide-react';

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
  { id: 'business', label: 'Business', icon: Briefcase, feed: 'topic', topic: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB' },
  { id: 'technology', label: 'Technology', icon: Cpu, feed: 'topic', topic: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB' },
  { id: 'sports', label: 'Sports', icon: Trophy, feed: 'topic', topic: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB' },
  { id: 'world', label: 'World', icon: Globe, feed: 'topic', topic: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB' },
  { id: 'wellesley', label: 'Wellesley', icon: MapPin, feed: 'local', location: 'Wellesley Massachusetts' },
  { id: 'dartmouth', label: 'Dartmouth', icon: MapPin, feed: 'local', location: 'Dartmouth Massachusetts' },
];

export default function NewsHub() {
  const [sections, setSections] = useState<Record<string, NewsSection>>({});
  const [activeTab, setActiveTab] = useState('top');
  const [refreshing, setRefreshing] = useState(false);

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
      } else if (section.feed === 'topic' && section.topic) {
        url += `&feed=topic&topic=${section.topic}`;
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
    } catch (err) {
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

  const currentSection = sections[activeTab];
  const activeConfig = SECTIONS.find(s => s.id === activeTab);
  const ActiveIcon = activeConfig?.icon || TrendingUp;

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Newspaper style={{ width: "20px", height: "20px", color: "#3b82f6" }} />
          <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>News</span>
        </div>
        <button
          onClick={refreshAll}
          disabled={refreshing}
          style={{
            padding: "8px",
            borderRadius: "8px",
            background: "transparent",
            border: "none",
            cursor: refreshing ? "not-allowed" : "pointer",
            opacity: refreshing ? 0.5 : 1
          }}
        >
          <RefreshCw style={{ 
            width: "16px", 
            height: "16px", 
            color: "rgba(255, 255, 255, 0.5)",
            animation: refreshing ? "spin 1s linear infinite" : "none"
          }} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "6px",
        padding: "8px 12px",
        overflowX: "auto",
        borderBottom: "1px solid rgba(255, 255, 255, 0.04)"
      }}>
        {SECTIONS.map(section => {
          const Icon = section.icon;
          const isActive = activeTab === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 500,
                whiteSpace: "nowrap",
                border: isActive ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid transparent",
                background: isActive ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.03)",
                color: isActive ? "#60a5fa" : "rgba(255, 255, 255, 0.6)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <Icon style={{ width: "14px", height: "14px" }} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* News Items */}
      <div style={{ padding: "12px", maxHeight: "400px", overflowY: "auto" }}>
        {currentSection?.loading && !currentSection.items.length ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{
              width: "24px",
              height: "24px",
              border: "2px solid #3b82f6",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
          </div>
        ) : currentSection?.error && !currentSection.items.length ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255, 255, 255, 0.4)" }}>
            {currentSection.error}
          </div>
        ) : !currentSection?.items.length ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255, 255, 255, 0.4)" }}>
            No recent news
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {currentSection?.items.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.04)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--foreground)",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "6px",
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.4)"
                    }}>
                      <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.source}
                      </span>
                      {item.relativeTime && (
                        <>
                          <span>•</span>
                          <span>{item.relativeTime}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ExternalLink style={{ width: "16px", height: "16px", color: "rgba(255, 255, 255, 0.3)", flexShrink: 0, marginTop: "2px" }} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(255, 255, 255, 0.04)"
      }}>
        <a
          href="https://news.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.35)",
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
