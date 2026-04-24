"use client";

import { useState, useEffect } from "react";

export interface QuickLink {
  id: string;
  name: string;
  url: string;
}

// Default quick links
const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { id: "spotify", name: "Spotify", url: "https://open.spotify.com" },
  { id: "claude", name: "Claude", url: "https://claude.ai" },
  { id: "grok", name: "Grok", url: "https://grok.com" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com" },
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com" },
];

const STORAGE_KEY = "cc-quick-links";

export function useQuickLinks() {
  const [links, setLinks] = useState<QuickLink[]>(DEFAULT_QUICK_LINKS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLinks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse quick links:", e);
      }
    }
    setLoaded(true);
  }, []);

  const saveLinks = (newLinks: QuickLink[]) => {
    setLinks(newLinks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks));
  };

  const addLink = (link: Omit<QuickLink, "id">) => {
    const newLink: QuickLink = {
      ...link,
      id: `link-${Date.now()}`,
    };
    saveLinks([...links, newLink]);
  };

  const updateLink = (id: string, updates: Partial<QuickLink>) => {
    saveLinks(links.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteLink = (id: string) => {
    saveLinks(links.filter(l => l.id !== id));
  };

  const reorderLinks = (newOrder: QuickLink[]) => {
    saveLinks(newOrder);
  };

  const resetToDefault = () => {
    saveLinks(DEFAULT_QUICK_LINKS);
  };

  return { links, loaded, addLink, updateLink, deleteLink, reorderLinks, resetToDefault };
}

interface QuickLinksProps {
  isMobile?: boolean;
}

export function QuickLinks({ isMobile = false }: QuickLinksProps) {
  const { links, loaded } = useQuickLinks();

  if (!loaded || links.length === 0) return null;

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: isMobile ? "10px" : "12px",
      justifyContent: "center",
      padding: isMobile ? "16px 0" : "20px 0",
    }}>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="quick-link-btn"
          style={{
            display: "flex",
            alignItems: "center",
            padding: isMobile ? "10px 18px" : "11px 22px",
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.04)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "rgba(255, 255, 255, 0.75)",
            textDecoration: "none",
            fontSize: isMobile ? "13px" : "14px",
            fontWeight: 500,
            letterSpacing: "0.01em",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          {link.name}
        </a>
      ))}

      <style jsx global>{`
        .quick-link-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(0, 170, 255, 0.3) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 170, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
          color: #00aaff !important;
        }
        .quick-link-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
