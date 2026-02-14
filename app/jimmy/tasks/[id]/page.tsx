"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { MarkdownContent } from "@/components/jimmy/MarkdownContent";
import { Sparkles, ArrowLeft, Download, Copy, CheckCircle, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  date: string;
  status: "completed" | "in-progress";
  preview: string;
  content?: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load task from Firestore
    const loadTask = async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        
        const docRef = doc(db, "jimmy_deliverables", params.id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTask({
            id: docSnap.id,
            title: data.title,
            date: data.date,
            status: data.status,
            preview: data.preview,
            content: data.content,
          });
        }
      } catch (e) {
        console.error("Failed to load task:", e);
      }
    };
    
    loadTask();
  }, [params.id]);

  const handleCopy = () => {
    if (task?.content) {
      navigator.clipboard.writeText(task.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPDF = () => {
    if (!task) return;
    // Render markdown content into a print-friendly window and trigger PDF save
    const contentEl = document.querySelector('[data-pdf-content]');
    const htmlContent = contentEl?.innerHTML || task.content || task.preview || '';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${task.title}</title>
        <style>
          @page { margin: 1in; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            line-height: 1.7;
            color: #1a1a1a;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-size: 14px;
          }
          .pdf-header {
            border-bottom: 2px solid #333;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .pdf-header h1 {
            font-size: 24px;
            margin: 0 0 8px 0;
            color: #111;
          }
          .pdf-header .meta {
            font-size: 12px;
            color: #666;
          }
          h1 { font-size: 22px; margin-top: 32px; }
          h2 { font-size: 18px; margin-top: 28px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
          h3 { font-size: 16px; margin-top: 24px; }
          h4 { font-size: 14px; margin-top: 20px; }
          p { margin: 10px 0; }
          ul, ol { padding-left: 24px; }
          li { margin: 6px 0; }
          blockquote {
            border-left: 3px solid #999;
            padding-left: 16px;
            margin: 16px 0;
            color: #444;
            font-style: italic;
          }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #f5f5f5; font-weight: 600; }
          code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
          pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
          pre code { background: none; padding: 0; }
          a { color: #0066cc; }
          hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
          strong { font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="pdf-header">
          <h1>${task.title}</h1>
          <div class="meta">${new Date(task.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Command Center Intelligence Brief</div>
        </div>
        ${htmlContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    
    // Give it a moment to render, then trigger print (Save as PDF)
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!task) {
    return (
      <>
        <TopNav />
        <BottomNav />
        <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
          <div style={{ textAlign: "center", padding: "60px", color: "var(--foreground-muted)" }}>
            Task not found
          </div>
        </main>
      </>
    );
  }

  const statusColors = {
    completed: "#10b981",
    "in-progress": "#6366f1",
  };

  const StatusIcon = task.status === "completed" ? CheckCircle : Clock;

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Back Button */}
          <button
            onClick={() => router.push("/jimmy")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              marginBottom: "24px",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              background: "transparent",
              color: "var(--foreground-muted)",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to Jimmy
          </button>

          {/* Header */}
          <div className="glass" style={{ padding: "32px", borderRadius: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Sparkles style={{ width: "24px", height: "24px", color: "white" }} />
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--foreground)", marginBottom: "12px", lineHeight: 1.2 }}>
                  {task.title}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: `${statusColors[task.status]}20`,
                      fontSize: "12px",
                      fontWeight: 600,
                      color: statusColors[task.status],
                      textTransform: "capitalize",
                    }}
                  >
                    <StatusIcon style={{ width: "14px", height: "14px" }} />
                    {task.status.replace("-", " ")}
                  </div>
                  <span style={{ fontSize: "14px", color: "var(--foreground-muted)" }}>
                    {new Date(task.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", paddingTop: "20px", borderTop: "1px solid var(--glass-border)" }}>
              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: copied ? "#10b981" : "transparent",
                  color: copied ? "white" : "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {copied ? <CheckCircle style={{ width: "16px", height: "16px" }} /> : <Copy style={{ width: "16px", height: "16px" }} />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleExportPDF}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <Download style={{ width: "16px", height: "16px" }} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="glass" style={{ padding: "32px", borderRadius: "12px" }} data-pdf-content>
            <MarkdownContent content={task.content || task.preview} />
          </div>
        </div>
      </main>
    </>
  );
}
