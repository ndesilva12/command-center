"use client";

import { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, Twitter, AlertCircle } from "lucide-react";

interface XPost {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    profileImageUrl?: string;
  };
  createdAt: string;
  relativeTime: string;
  url: string;
  metrics?: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

interface XForYouProps {
  isMobile?: boolean;
}

export function XForYou({ isMobile = false }: XForYouProps) {
  const [posts, setPosts] = useState<XPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkConnectionAndFetch();
  }, []);

  const checkConnectionAndFetch = async () => {
    try {
      // Check if X is connected
      const statusRes = await fetch('/api/auth/x/status');
      const statusData = await statusRes.json();
      
      setConnected(statusData.connected);
      
      if (statusData.connected && !statusData.is_expired) {
        await fetchForYou();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking X status:', err);
      setConnected(false);
      setLoading(false);
    }
  };

  const fetchForYou = async () => {
    try {
      setError(null);
      const response = await fetch('/api/x-for-you');
      
      if (!response.ok) {
        if (response.status === 401) {
          setConnected(false);
          return;
        }
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching X For You:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchForYou();
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/x';
  };

  // Not connected state
  if (connected === false) {
    return (
      <div style={{
        padding: isMobile ? "20px" : "24px",
        borderRadius: "16px",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        marginBottom: isMobile ? "24px" : "32px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #1d9bf0 0%, #0d8bd9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Twitter style={{ width: "18px", height: "18px", color: "white" }} />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255, 255, 255, 0.95)" }}>
              X For You
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>
              Personalized timeline
            </div>
          </div>
        </div>
        
        <p style={{
          fontSize: "14px",
          color: "rgba(255, 255, 255, 0.6)",
          marginBottom: "16px",
          lineHeight: 1.5,
        }}>
          Connect your X account to see your personalized For You feed here.
        </p>
        
        <button
          onClick={handleConnect}
          style={{
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #1d9bf0 0%, #0d8bd9 100%)",
            color: "white",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
        >
          <Twitter style={{ width: "16px", height: "16px" }} />
          Connect X Account
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        padding: isMobile ? "20px" : "24px",
        borderRadius: "16px",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        marginBottom: isMobile ? "24px" : "32px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
        }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #1d9bf0 0%, #0d8bd9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Twitter style={{ width: "18px", height: "18px", color: "white" }} />
          </div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255, 255, 255, 0.95)" }}>
            X For You
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <RefreshCw style={{
            width: "24px",
            height: "24px",
            color: "#1d9bf0",
            animation: "spin 1s linear infinite",
          }} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        padding: isMobile ? "20px" : "24px",
        borderRadius: "16px",
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        marginBottom: isMobile ? "24px" : "32px",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <AlertCircle style={{ width: "20px", height: "20px", color: "#ef4444" }} />
          <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "14px" }}>
            {error}
          </span>
          <button
            onClick={handleRefresh}
            style={{
              marginLeft: "auto",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background: "transparent",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginBottom: isMobile ? "24px" : "32px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        paddingBottom: "12px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}>
        <a
          href="https://x.com/home"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #1d9bf0 0%, #0d8bd9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Twitter style={{ width: "18px", height: "18px", color: "white" }} />
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255, 255, 255, 0.95)" }}>
              X For You
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>
              Your personalized feed
            </div>
          </div>
        </a>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: "8px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            color: "rgba(255, 255, 255, 0.5)",
            cursor: refreshing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RefreshCw style={{
            width: "14px",
            height: "14px",
            animation: refreshing ? "spin 1s linear infinite" : "none",
          }} />
        </button>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: "14px",
        }}>
          No posts to show
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {posts.slice(0, 8).map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="x-post-item"
              style={{
                display: "block",
                padding: isMobile ? "14px 0" : "16px 0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                textDecoration: "none",
              }}
            >
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}>
                {/* Avatar */}
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1d9bf0 0%, #0d8bd9 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                }}>
                  {post.author.profileImageUrl ? (
                    <img
                      src={post.author.profileImageUrl}
                      alt={post.author.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>
                      {post.author.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Author info */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "4px",
                  }}>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.95)",
                    }}>
                      {post.author.name}
                    </span>
                    <span style={{
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.4)",
                    }}>
                      @{post.author.username}
                    </span>
                    <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>·</span>
                    <span style={{
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.4)",
                    }}>
                      {post.relativeTime}
                    </span>
                  </div>

                  {/* Post text */}
                  <div style={{
                    fontSize: isMobile ? "14px" : "15px",
                    color: "rgba(255, 255, 255, 0.85)",
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {post.text}
                  </div>

                  {/* Metrics */}
                  {post.metrics && (
                    <div style={{
                      display: "flex",
                      gap: "16px",
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.4)",
                    }}>
                      {post.metrics.replies > 0 && (
                        <span>{post.metrics.replies.toLocaleString()} replies</span>
                      )}
                      {post.metrics.retweets > 0 && (
                        <span>{post.metrics.retweets.toLocaleString()} reposts</span>
                      )}
                      {post.metrics.likes > 0 && (
                        <span>{post.metrics.likes.toLocaleString()} likes</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* View more link */}
      <a
        href="https://x.com/home"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "16px",
          fontSize: "13px",
          fontWeight: 500,
          color: "#1d9bf0",
          textDecoration: "none",
        }}
      >
        View more on X
        <ExternalLink style={{ width: "12px", height: "12px" }} />
      </a>

      <style jsx global>{`
        .x-post-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}</style>
    </div>
  );
}
