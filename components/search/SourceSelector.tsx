"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { UNIFIED_SOURCES, UnifiedSourceId, UnifiedSourceConfig } from "@/lib/unified-sources";

interface SourceSelectorProps {
  selectedSource: UnifiedSourceId;
  onSelectSource: (source: UnifiedSourceId) => void;
}

export function SourceSelector({ selectedSource, onSelectSource }: SourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedConfig = UNIFIED_SOURCES.find(s => s.id === selectedSource);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group sources by type
  const webSources = UNIFIED_SOURCES.filter(s => s.type === "web");
  const aiSources = UNIFIED_SOURCES.filter(s => s.type === "ai");

  const renderSource = (source: UnifiedSourceConfig) => (
    <button
      key={source.id}
      onClick={() => {
        onSelectSource(source.id);
        setIsOpen(false);
      }}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "6px",
        border: "none",
        background: selectedSource === source.id ? "rgba(255, 255, 255, 0.1)" : "transparent",
        color: selectedSource === source.id ? "var(--accent)" : "var(--foreground)",
        fontSize: "14px",
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (selectedSource !== source.id) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
        }
      }}
      onMouseLeave={(e) => {
        if (selectedSource !== source.id) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <span style={{ flex: 1 }}>{source.name}</span>
    </button>
  );

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "0",
          border: "none",
          background: "transparent",
          color: "#00aaff",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = "none";
        }}
      >
        <span>{selectedConfig?.name || "Select"}</span>
        <ChevronDown
          style={{
            width: "14px",
            height: "14px",
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            minWidth: "240px",
            maxHeight: "400px",
            overflowY: "auto",
            borderRadius: "12px",
            padding: "8px",
            zIndex: 1000,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            background: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Web Sources */}
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                padding: "8px 14px 4px 14px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--foreground-muted)",
              }}
            >
              Web
            </div>
            {webSources.map(renderSource)}
          </div>

          {/* AI Sources */}
          <div>
            <div
              style={{
                padding: "8px 14px 4px 14px",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--foreground-muted)",
              }}
            >
              AI
            </div>
            {aiSources.map(renderSource)}
          </div>
        </div>
      )}
    </div>
  );
}
