"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";

import { FileText, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LegalDoc {
  id: string;
  title: string;
  date: string;
  status: "draft" | "review" | "approved" | "executed";
  preview: string;
  content: string;
  phase?: string;
}

export default function LegalDocsPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('legal-docs', 'Legal Docs', '#8b5cf6');
  const [isMobile, setIsMobile] = useState(false);
  const [documents, setDocuments] = useState<LegalDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "review" | "approved">("all");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "jimmy_deliverables"),
        where("createdBy", "==", "legal-jimmy"),
        orderBy("date", "desc")
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LegalDoc[];
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading legal documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "#94a3b8";
      case "review": return "#f59e0b";
      case "approved": return "#10b981";
      case "executed": return "#8b5cf6";
      case "completed": return "#10b981";
      case "in_progress": return "#f59e0b";
      default: return "#94a3b8";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
      case "in_progress":
        return <Clock style={{ width: "16px", height: "16px" }} />;
      case "review":
        return <AlertCircle style={{ width: "16px", height: "16px" }} />;
      case "approved":
      case "completed":
      case "executed":
        return <CheckCircle style={{ width: "16px", height: "16px" }} />;
      default:
        return <FileText style={{ width: "16px", height: "16px" }} />;
    }
  };

  const filteredDocs = filter === "all" 
    ? documents 
    : documents.filter(doc => doc.status === filter);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <TopNav />
      <Sidebar />
      <ToolBackground color={toolCustom.color} />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: isMobile ? "80px 12px 80px" : "96px 24px 32px",
          paddingLeft: isMobile ? "12px" : "calc(var(--sidebar-width, 240px) + 24px)",
          minHeight: isMobile ? "calc(100vh - 144px)" : "calc(100vh - 168px)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <FileText style={{ width: "32px", height: "32px", color: toolCustom.color }} />
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>Legal Documents</h1>
          </div>
          <p style={{ color: "var(--foreground-muted)", fontSize: "15px" }}>
            Cinderella Project legal documentation and contracts
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {["all", "draft", "review", "approved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid var(--glass-border)",
                background: filter === f ? "rgba(139, 92, 246, 0.1)" : "transparent",
                color: filter === f ? toolCustom.color : "var(--foreground-muted)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "all 0.2s",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="glass" style={{ padding: "40px", borderRadius: "16px", textAlign: "center" }}>
            <div style={{ color: "var(--foreground-muted)" }}>Loading documents...</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : selectedDoc ? "400px 1fr" : "1fr", gap: "24px" }}>
            {/* Document List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredDocs.length === 0 ? (
                <div className="glass" style={{ padding: "24px", borderRadius: "16px", textAlign: "center" }}>
                  <div style={{ color: "var(--foreground-muted)", fontSize: "14px" }}>
                    No documents found
                  </div>
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="glass"
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      border: selectedDoc?.id === doc.id ? `2px solid ${toolCustom.color}` : "2px solid transparent",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDoc?.id !== doc.id) {
                        e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDoc?.id !== doc.id) {
                        e.currentTarget.style.borderColor = "transparent";
                      }
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", flex: 1 }}>
                        {doc.title}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: `${getStatusColor(doc.status)}20`,
                          color: getStatusColor(doc.status),
                          fontSize: "12px",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {getStatusIcon(doc.status)}
                        {doc.status.replace("_", " ")}
                      </div>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "8px", lineHeight: 1.4 }}>
                      {doc.preview}
                    </div>
                    <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                      <span>{doc.date}</span>
                      {doc.phase && <span>• {doc.phase}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Document Viewer */}
            {selectedDoc && !isMobile && (
              <div className="glass" style={{ padding: "32px", borderRadius: "16px", maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--foreground)" }}>
                      {selectedDoc.title}
                    </h2>
                    <button
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "1px solid var(--glass-border)",
                        background: "rgba(139, 92, 246, 0.1)",
                        color: toolCustom.color,
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => {
                        const blob = new Blob([selectedDoc.content], { type: "text/markdown" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${selectedDoc.title.toLowerCase().replace(/ /g, "-")}.md`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download style={{ width: "14px", height: "14px" }} />
                      Download
                    </button>
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    {selectedDoc.date} • {selectedDoc.status.replace("_", " ").toUpperCase()}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--foreground)",
                    lineHeight: 1.8,
                    fontFamily: "var(--font-mono, 'Courier New', monospace)",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                  }}
                >
                  {selectedDoc.content}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
