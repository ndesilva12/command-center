"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headers
          h1: ({ node, ...props }) => (
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #00aaff 0%, #667eea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "20px",
                marginTop: "32px",
                lineHeight: 1.3,
              }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#00aaff",
                marginBottom: "16px",
                marginTop: "32px",
                paddingBottom: "8px",
                borderBottom: "1px solid rgba(0, 170, 255, 0.2)",
                lineHeight: 1.4,
              }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--foreground)",
                marginBottom: "12px",
                marginTop: "24px",
                lineHeight: 1.4,
              }}
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--foreground-muted)",
                marginBottom: "10px",
                marginTop: "20px",
                lineHeight: 1.4,
              }}
              {...props}
            />
          ),
          h5: ({ node, ...props }) => (
            <h5
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--foreground-muted)",
                marginBottom: "8px",
                marginTop: "16px",
                lineHeight: 1.4,
              }}
              {...props}
            />
          ),
          h6: ({ node, ...props }) => (
            <h6
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--foreground-muted)",
                marginBottom: "8px",
                marginTop: "12px",
                lineHeight: 1.4,
              }}
              {...props}
            />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p
              style={{
                fontSize: "16px",
                lineHeight: 1.8,
                color: "var(--foreground)",
                marginBottom: "16px",
              }}
              {...props}
            />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              style={{
                color: "#00aaff",
                textDecoration: "none",
                borderBottom: "1px solid transparent",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderBottom = "1px solid #00aaff";
                e.currentTarget.style.color = "#33bbff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderBottom = "1px solid transparent";
                e.currentTarget.style.color = "#00aaff";
              }}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Strong/Bold
          strong: ({ node, ...props }) => (
            <strong
              style={{
                fontWeight: 700,
                color: "#ffffff",
                background: "rgba(0, 170, 255, 0.1)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
              {...props}
            />
          ),

          // Emphasis/Italic
          em: ({ node, ...props }) => (
            <em
              style={{
                fontStyle: "italic",
                color: "rgba(255, 255, 255, 0.9)",
              }}
              {...props}
            />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul
              style={{
                marginLeft: "24px",
                marginBottom: "16px",
                lineHeight: 1.8,
              }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              style={{
                marginLeft: "24px",
                marginBottom: "16px",
                lineHeight: 1.8,
              }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              style={{
                fontSize: "16px",
                color: "var(--foreground)",
                marginBottom: "8px",
                paddingLeft: "8px",
              }}
              {...props}
            />
          ),

          // Code blocks
          code: ({ node, inline, ...props }) => {
            if (inline) {
              return (
                <code
                  style={{
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                    fontSize: "14px",
                    background: "rgba(0, 170, 255, 0.15)",
                    color: "#00aaff",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    border: "1px solid rgba(0, 170, 255, 0.3)",
                  }}
                  {...props}
                />
              );
            }
            return (
              <code
                style={{
                  fontFamily: "'Fira Code', 'Courier New', monospace",
                  fontSize: "14px",
                  display: "block",
                  background: "rgba(0, 0, 0, 0.4)",
                  color: "#e5e7eb",
                  padding: "16px",
                  borderRadius: "8px",
                  overflowX: "auto",
                  marginBottom: "16px",
                  border: "1px solid var(--glass-border)",
                }}
                {...props}
              />
            );
          },
          pre: ({ node, ...props }) => (
            <pre
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                padding: "0",
                borderRadius: "8px",
                marginBottom: "24px",
                overflow: "hidden",
              }}
              {...props}
            />
          ),

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: "4px solid #00aaff",
                paddingLeft: "16px",
                marginLeft: "0",
                marginBottom: "16px",
                color: "var(--foreground-muted)",
                fontStyle: "italic",
                background: "rgba(0, 170, 255, 0.05)",
                padding: "12px 16px",
                borderRadius: "4px",
              }}
              {...props}
            />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--glass-border)",
                marginTop: "32px",
                marginBottom: "32px",
              }}
              {...props}
            />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div style={{ overflowX: "auto", marginBottom: "24px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "15px",
                }}
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              style={{
                background: "rgba(0, 170, 255, 0.1)",
              }}
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                fontWeight: 600,
                color: "#00aaff",
                borderBottom: "2px solid rgba(0, 170, 255, 0.3)",
              }}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              style={{
                padding: "12px",
                borderBottom: "1px solid var(--glass-border)",
                color: "var(--foreground)",
              }}
              {...props}
            />
          ),
          tr: ({ node, ...props }) => (
            <tr
              style={{
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      <style jsx global>{`
        .markdown-content > :first-child {
          margin-top: 0 !important;
        }
      `}</style>
    </div>
  );
}
