"use client";

import { useState, useEffect, useMemo } from "react";
import { FolderOpen, ExternalLink, RefreshCw, File, FileText, FileImage, FileVideo, FileAudio, FileArchive, FileCode, AlertCircle, Clock, Sheet, Presentation, FileSpreadsheet, Files, Search } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";

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

type FileTypeFilter = 'all' | 'docs' | 'sheets' | 'slides' | 'pdfs' | 'images' | 'videos' | 'folders' | 'other';

const FILE_TYPE_CONFIG: Record<FileTypeFilter, { label: string; icon: any; color: string; mimePatterns: string[] }> = {
  all: { label: 'All Files', icon: Files, color: '#6366f1', mimePatterns: [] },
  docs: { label: 'Documents', icon: FileText, color: '#4285f4', mimePatterns: ['document', 'word', 'text/plain'] },
  sheets: { label: 'Spreadsheets', icon: FileSpreadsheet, color: '#0f9d58', mimePatterns: ['spreadsheet', 'excel', 'csv'] },
  slides: { label: 'Presentations', icon: Presentation, color: '#f4b400', mimePatterns: ['presentation', 'powerpoint'] },
  pdfs: { label: 'PDFs', icon: FileText, color: '#ea4335', mimePatterns: ['pdf'] },
  images: { label: 'Images', icon: FileImage, color: '#ff6d01', mimePatterns: ['image'] },
  videos: { label: 'Videos', icon: FileVideo, color: '#9c27b0', mimePatterns: ['video'] },
  folders: { label: 'Folders', icon: FolderOpen, color: '#607d8b', mimePatterns: ['folder'] },
  other: { label: 'Other', icon: File, color: '#78909c', mimePatterns: [] },
};

const getFileType = (mimeType: string): FileTypeFilter => {
  if (mimeType.includes('folder')) return 'folders';
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType === 'text/plain') return 'docs';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'sheets';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slides';
  if (mimeType.includes('pdf')) return 'pdfs';
  if (mimeType.includes('image')) return 'images';
  if (mimeType.includes('video')) return 'videos';
  return 'other';
};

const getFileIcon = (mimeType: string) => {
  const type = getFileType(mimeType);
  return FILE_TYPE_CONFIG[type].icon;
};

const getFileColor = (mimeType: string) => {
  const type = getFileType(mimeType);
  return FILE_TYPE_CONFIG[type].color;
};

const formatFileSize = (bytes?: string): string => {
  if (!bytes) return '';
  const size = parseInt(bytes);
  if (isNaN(size)) return '';
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
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function FilesPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('files', 'Files', '#6366f1');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedType, setSelectedType] = useState<FileTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
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

  // Count files by type
  const typeCounts = useMemo(() => {
    const counts: Record<FileTypeFilter, number> = {
      all: files.length,
      docs: 0, sheets: 0, slides: 0, pdfs: 0, images: 0, videos: 0, folders: 0, other: 0
    };
    files.forEach(file => {
      const type = getFileType(file.mimeType);
      counts[type]++;
    });
    return counts;
  }, [files]);

  // Filter files
  const filteredFiles = useMemo(() => {
    let result = files;
    
    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter(file => getFileType(file.mimeType) === selectedType);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(file => file.name.toLowerCase().includes(q));
    }
    
    return result;
  }, [files, selectedType, searchQuery]);

  return (
    <>
      <TopNav />
      <BottomNav />
      <Sidebar />
      <ToolBackground color={toolCustom.color} />

      <main style={{
        paddingTop: isMobile ? "64px" : "68px",
        paddingBottom: isMobile ? "80px" : "16px",
        paddingLeft: isMobile ? "8px" : "calc(var(--sidebar-width, 240px) + 8px)",
        paddingRight: isMobile ? "8px" : "8px",
        minHeight: "100vh",
      }}>
        <div style={{ 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          gap: "12px",
          height: isMobile ? "auto" : "calc(100vh - 84px)",
        }}>
          {/* Left Panel: Filters */}
          <div style={{ 
            width: isMobile ? "100%" : "240px",
            minWidth: isMobile ? "100%" : "240px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            height: isMobile ? "auto" : "100%",
            overflow: isMobile ? "visible" : "auto",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FolderOpen style={{ width: "20px", height: "20px", color: toolCustom.color }} />
                <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Files</h1>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => window.open('https://drive.google.com', '_blank')}
                  style={{
                    padding: "6px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  title="Open Drive"
                >
                  <ExternalLink style={{ width: "14px", height: "14px" }} />
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={loading || refreshing}
                  style={{
                    padding: "6px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "var(--foreground-muted)",
                    border: "none",
                    cursor: loading || refreshing ? "not-allowed" : "pointer",
                    opacity: loading || refreshing ? 0.6 : 1,
                  }}
                  title="Refresh"
                >
                  <RefreshCw style={{ width: "14px", height: "14px", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--foreground-muted)",
              }} />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 32px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            {/* File Type Filters */}
            <div className="glass card" style={{ padding: "12px", flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                File Types
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {(Object.entries(FILE_TYPE_CONFIG) as [FileTypeFilter, typeof FILE_TYPE_CONFIG['all']][]).map(([type, config]) => {
                  const count = typeCounts[type];
                  const Icon = config.icon;
                  const isSelected = selectedType === type;
                  
                  // Skip types with no files (except 'all')
                  if (type !== 'all' && count === 0) return null;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: "6px",
                        border: isSelected ? `2px solid ${config.color}` : '1px solid transparent',
                        background: isSelected ? `${config.color}15` : 'rgba(255, 255, 255, 0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Icon size={16} style={{ color: isSelected ? config.color : 'var(--foreground-muted)' }} />
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? config.color : 'var(--foreground)',
                        }}>
                          {config.label}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: isSelected ? config.color : 'var(--foreground-muted)',
                        background: isSelected ? `${config.color}20` : 'rgba(255,255,255,0.08)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Files */}
          <div style={{ 
            flex: 1,
            minWidth: 0,
            height: isMobile ? "auto" : "100%",
            overflow: isMobile ? "visible" : "auto",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Results Header */}
            <div style={{
              padding: "10px 16px",
              background: `${FILE_TYPE_CONFIG[selectedType].color}10`,
              borderRadius: "10px",
              border: `1px solid ${FILE_TYPE_CONFIG[selectedType].color}20`,
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {(() => {
                  const Icon = FILE_TYPE_CONFIG[selectedType].icon;
                  return <Icon size={18} style={{ color: FILE_TYPE_CONFIG[selectedType].color }} />;
                })()}
                <span style={{ fontSize: "15px", fontWeight: 600, color: FILE_TYPE_CONFIG[selectedType].color }}>
                  {FILE_TYPE_CONFIG[selectedType].label}
                </span>
              </div>
              <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
            </div>

            {/* Files List */}
            <div className="glass card" style={{ flex: 1, padding: "8px", overflow: "auto" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--foreground-muted)" }}>
                  <RefreshCw style={{ width: "24px", height: "24px", marginRight: "12px", animation: "spin 1s linear infinite", color: toolCustom.color }} />
                  Loading files...
                </div>
              ) : error ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--foreground-muted)", gap: "12px" }}>
                  <AlertCircle style={{ width: "40px", height: "40px", color: "#ff4444" }} />
                  <p style={{ margin: 0 }}>{error}</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--foreground-muted)", gap: "12px" }}>
                  <FolderOpen style={{ width: "40px", height: "40px", opacity: 0.4 }} />
                  <p style={{ margin: 0 }}>
                    {searchQuery ? `No files matching "${searchQuery}"` : 'No files found'}
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: "8px" }}>
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file.mimeType);
                    const fileColor = getFileColor(file.mimeType);
                    return (
                      <div
                        key={file.id}
                        onClick={() => handleFileClick(file)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 14px",
                          background: "rgba(255, 255, 255, 0.02)",
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                          e.currentTarget.style.borderColor = `${fileColor}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                        }}
                      >
                        <div style={{ marginRight: "12px", flexShrink: 0 }}>
                          <FileIcon style={{ width: "18px", height: "18px", color: fileColor }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0, marginRight: "12px" }}>
                          <h3 style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "var(--foreground)",
                            marginBottom: "2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {file.name}
                          </h3>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--foreground-muted)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                              <Clock style={{ width: "10px", height: "10px" }} />
                              {formatDate(file.modifiedTime)}
                            </span>
                            {file.size && <span>{formatFileSize(file.size)}</span>}
                          </div>
                        </div>

                        <ExternalLink style={{ width: "14px", height: "14px", color: "var(--foreground-muted)", flexShrink: 0, opacity: 0.5 }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
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
