"use client";

import { useState, useEffect } from "react";
import { Rss, Plus, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

interface RSSFeed {
  id: string;
  url: string;
  title: string;
}

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  feedTitle: string;
}

export default function RSSPage() {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [items, setItems] = useState<RSSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [showAddFeed, setShowAddFeed] = useState(false);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    setLoading(true);
    try {
      const userId = "norman";
      const feedsRef = collection(db, "users", userId, "rss-feeds");
      const snapshot = await getDocs(feedsRef);
      const loadedFeeds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as RSSFeed));
      
      setFeeds(loadedFeeds);
      
      // Default feeds if none exist
      if (loadedFeeds.length === 0) {
        const defaultFeeds = [
          { id: "hn", url: "https://hnrss.org/frontpage", title: "Hacker News" },
          { id: "techcrunch", url: "https://techcrunch.com/feed/", title: "TechCrunch" },
        ];
        setFeeds(defaultFeeds);
        for (const feed of defaultFeeds) {
          await setDoc(doc(db, "users", userId, "rss-feeds", feed.id), feed);
        }
      }
    } catch (err) {
      console.error("Failed to load feeds:", err);
    } finally {
      setLoading(false);
    }
  };

  const addFeed = async () => {
    if (!newFeedUrl.trim()) return;
    
    try {
      const userId = "norman";
      const feedId = `feed_${Date.now()}`;
      const feed = {
        id: feedId,
        url: newFeedUrl,
        title: new URL(newFeedUrl).hostname,
      };
      
      await setDoc(doc(db, "users", userId, "rss-feeds", feedId), feed);
      setFeeds(prev => [...prev, feed]);
      setNewFeedUrl("");
      setShowAddFeed(false);
    } catch (err) {
      console.error("Failed to add feed:", err);
      alert("Failed to add feed");
    }
  };

  const removeFeed = async (feedId: string) => {
    try {
      const userId = "norman";
      await deleteDoc(doc(db, "users", userId, "rss-feeds", feedId));
      setFeeds(prev => prev.filter(f => f.id !== feedId));
    } catch (err) {
      console.error("Failed to remove feed:", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "80px 20px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Rss size={48} style={{ color: "var(--primary)" }} />
            <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "var(--foreground)", margin: 0 }}>RSS Feeds</h1>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => window.open('https://feedly.com', '_blank')}
              style={{
                padding: "10px 20px",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "8px",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ExternalLink size={16} />
              Open Feedly
            </button>
            
            <button
              onClick={() => setShowAddFeed(true)}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                border: "none",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Plus size={16} />
              Add Feed
            </button>
          </div>
        </div>

        {/* Feed List */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--foreground)", marginBottom: "16px" }}>
            Your Feeds ({feeds.length})
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {feeds.map((feed) => (
              <div
                key={feed.id}
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--foreground)", marginBottom: "4px" }}>
                    {feed.title}
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {feed.url}
                  </p>
                </div>
                <button
                  onClick={() => removeFeed(feed.id)}
                  style={{
                    padding: "6px",
                    background: "transparent",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={14} style={{ color: "#ef4444" }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Feed Modal */}
        {showAddFeed && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => setShowAddFeed(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--background)",
                border: "1px solid var(--glass-border)",
                borderRadius: "16px",
                maxWidth: "500px",
                width: "100%",
                padding: "32px",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "var(--foreground)", marginBottom: "20px" }}>
                Add RSS Feed
              </h2>
              
              <input
                type="url"
                value={newFeedUrl}
                onChange={(e) => setNewFeedUrl(e.target.value)}
                placeholder="https://example.com/feed.xml"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  marginBottom: "20px",
                }}
              />
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={addFeed}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Add Feed
                </button>
                
                <button
                  onClick={() => setShowAddFeed(false)}
                  style={{
                    padding: "12px 24px",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feed Items Placeholder */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "var(--foreground)", marginBottom: "16px" }}>
            Latest Articles
          </h2>
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>
            RSS feed parsing coming soon. For now, manage your feeds above and visit them in Feedly.
          </p>
        </div>
      </div>
    </div>
  );
}
