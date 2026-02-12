"use client";

import { useState, useEffect } from "react";
import { FolderOpen, ExternalLink, RefreshCw, File, FileText, FileImage, FileVideo, FileAudio, FileArchive, FileCode, AlertCircle, Clock } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";


interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink: string;
  iconLink?: string;
  thumbnailLink?: string;
  accountEmail?: string;
  accountName?: string;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('folder')) return FolderOpen;
  if (mimeType.includes('image')) return FileImage;
  if (mimeType.includes('video')) return FileVideo;
  if (mimeType.includes('audio')) return FileAudio;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return FileArchive;
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('python')) return FileCode;
  return File;
};

const formatFileSize = (bytes?: string): string => {
  if (!bytes) return 'N/A';
  const size = parseInt(bytes);
  if (isNaN(size)) return 'N/A';

  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
  return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
};

export default function FilesPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('files', 'Files', '#6366f1');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setError(null);
      const res = await fetch('/api/drive/files');

      if (!res.ok) {
        if (res.status === 401) {
          setError('Please connect a Google account to view files');
        } else {
          setError('Failed to fetch files');
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  const handleFileClick = (file: DriveFile) => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="files" />

      <main style={{
        paddingTop: isMobile ? "64px" : "136px",
        paddingBottom: isMobile ? "88px" : "32px",
        paddingLeft: isMobile ? "12px" : "24px",
        paddingRight: isMobile ? "12px" : "24px",
        minHeight: `calc(100vh - ${isMobile ? "144px" : "168px"})`,
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FolderOpen style={{ width: "24px", height: "24px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>{toolCustom.name}</h1>
            {!loading && !error && (
              <span style={{ fontSize: "14px", color: "var(--foreground-muted)", marginLeft: "4px" }}>
                ({files.length})
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => window.open('https://drive.google.com', '_blank')}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--foreground-muted)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                cursor: "pointer",
                fontSize: "13px",
                transition: "all 0.15s ease",
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
              Open Drive
            </button>
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
            <p style={{ color: "var(--foreground-muted)" }}>Loading files...</p>
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
        ) : files.length === 0 ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center"
          }}>
            <FolderOpen style={{ width: "48px", height: "48px", color: "#00aaff", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
              No files found
            </h2>
            <p style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
              Your Google Drive files will appear here
            </p>
          </div>
        ) : (
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file.mimeType);
              return (
                <div
                  key={file.id}
                  onClick={() => handleFileClick(file)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: index < files.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ marginRight: "16px", flexShrink: 0 }}>
                    <FileIcon style={{ width: "20px", height: "20px", color: "#00aaff" }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0, marginRight: "16px" }}>
                    <h3 style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--foreground)",
                      marginBottom: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {file.name}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock style={{ width: "12px", height: "12px" }} />
                        {formatDate(file.modifiedTime)}
                      </div>
                      {file.size && (
                        <span>{formatFileSize(file.size)}</span>
                      )}
                    </div>
                  </div>

                  <ExternalLink style={{ width: "16px", height: "16px", color: "var(--foreground-muted)", flexShrink: 0 }} />
                </div>
              );
            })}
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
