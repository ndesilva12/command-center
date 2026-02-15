"use client";
import { Download } from "lucide-react";

export function ExportPDFButton({ title }: { title?: string }) {
  const handleExport = () => {
    const originalTitle = document.title;
    if (title) document.title = title;
    window.print();
    document.title = originalTitle;
  };

  return (
    <button
      onClick={handleExport}
      className="no-print"
      style={{
        padding: "8px 16px",
        borderRadius: "8px",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        background: "rgba(139, 92, 246, 0.1)",
        color: "#8b5cf6",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        transition: "all 0.2s",
      }}
    >
      <Download style={{ width: "14px", height: "14px" }} />
      Export PDF
    </button>
  );
}
