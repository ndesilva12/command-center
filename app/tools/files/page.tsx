"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { FolderOpen, File, Upload, Search } from "lucide-react";

interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  size?: string;
  modifiedAt: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setFiles([
      { id: "1", name: "Documents", type: "folder", modifiedAt: "2 days ago" },
      { id: "2", name: "Images", type: "folder", modifiedAt: "1 week ago" },
      { id: "3", name: "Project Proposal.pdf", type: "file", size: "2.4 MB", modifiedAt: "3 hours ago" },
      { id: "4", name: "Budget 2026.xlsx", type: "file", size: "856 KB", modifiedAt: "1 day ago" },
    ]);
  }, []);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FolderOpen style={{ width: "28px", height: "28px", color: "var(--accent)" }} />
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>Files</h1>
            </div>
            <button style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "var(--accent)", color: "var(--background)", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              <Upload style={{ width: "16px", height: "16px" }} />
              Upload
            </button>
          </div>

          <div className="glass" style={{ padding: "16px", borderRadius: "12px", marginBottom: "24px" }}>
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "18px", height: "18px", color: "var(--foreground-muted)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                style={{ width: "100%", padding: "12px 14px 12px 44px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "var(--foreground)", fontSize: "14px", outline: "none" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {filteredFiles.map(file => (
              <div key={file.id} className="glass" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", borderRadius: "12px", cursor: "pointer" }}>
                {file.type === "folder" ? (
                  <FolderOpen style={{ width: "24px", height: "24px", color: "var(--accent)" }} />
                ) : (
                  <File style={{ width: "24px", height: "24px", color: "var(--foreground-muted)" }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)", marginBottom: "2px" }}>{file.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                    {file.size && `${file.size} • `}{file.modifiedAt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
