"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { Scale, Upload, FileText, AlertTriangle, Send } from "lucide-react";

export default function LegalPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"question" | "review">("question");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    // TODO: Integrate with backend/OpenClaw for actual legal skill processing
    // For now, show placeholder response
    setTimeout(() => {
      setResponse(`Legal analysis for: "${question}"\n\n[This will integrate with the legal skill via OpenClaw]`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <TopNav />
      <ToolNav currentToolId="legal" />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: isMobile ? "80px 12px 80px" : "136px 24px 32px",
          minHeight: isMobile ? "calc(100vh - 144px)" : "calc(100vh - 168px)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Scale style={{ width: "32px", height: "32px", color: "#00aaff" }} />
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--foreground)" }}>
              Legal Assistant
            </h1>
          </div>
          <p style={{ color: "var(--foreground-muted)", fontSize: "15px" }}>
            Contract review, compliance guidance, and legal information
          </p>
        </div>

        {/* Important Disclaimer */}
        <div
          className="glass"
          style={{
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid rgba(255, 193, 7, 0.3)",
            background: "rgba(255, 193, 7, 0.05)",
          }}
        >
          <div style={{ display: "flex", gap: "12px" }}>
            <AlertTriangle style={{ width: "20px", height: "20px", color: "#ffc107", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "4px" }}>
                Legal Information, Not Legal Advice
              </div>
              <div style={{ fontSize: "13px", color: "var(--foreground-muted)", lineHeight: 1.5 }}>
                This tool provides general legal information only and does not constitute legal advice for your specific situation. 
                Consult a licensed attorney in your jurisdiction before making legal decisions.
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <button
            onClick={() => setActiveTab("question")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "question" ? "rgba(0, 170, 255, 0.1)" : "transparent",
              color: activeTab === "question" ? "#00aaff" : "var(--foreground-muted)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            <FileText style={{ width: "16px", height: "16px" }} />
            Ask a Question
          </button>
          <button
            onClick={() => setActiveTab("review")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "review" ? "rgba(0, 170, 255, 0.1)" : "transparent",
              color: activeTab === "review" ? "#00aaff" : "var(--foreground-muted)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            <Upload style={{ width: "16px", height: "16px" }} />
            Review Document
          </button>
        </div>

        {/* Question Tab */}
        {activeTab === "question" && (
          <div>
            <div className="glass" style={{ padding: "24px", borderRadius: "16px", marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--foreground)",
                  marginBottom: "12px",
                }}
              >
                Your Legal Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., 'Explain GDPR requirements for my SaaS startup' or 'What's the difference between LLC and S-Corp?'"
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "rgba(0, 0, 0, 0.2)",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.5)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--glass-border)";
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!question.trim() || loading}
                style={{
                  marginTop: "16px",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: question.trim() && !loading ? "linear-gradient(135deg, #00aaff 0%, #0088cc 100%)" : "rgba(100, 100, 100, 0.3)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: question.trim() && !loading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                <Send style={{ width: "16px", height: "16px" }} />
                {loading ? "Analyzing..." : "Get Legal Information"}
              </button>
            </div>

            {/* Response */}
            {response && (
              <div
                className="glass"
                style={{
                  padding: "24px",
                  borderRadius: "16px",
                }}
              >
                <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
                  Legal Information
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--foreground-muted)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {response}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document Review Tab */}
        {activeTab === "review" && (
          <div className="glass" style={{ padding: "24px", borderRadius: "16px" }}>
            <div
              style={{
                border: "2px dashed var(--glass-border)",
                borderRadius: "12px",
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#00aaff";
                e.currentTarget.style.background = "rgba(0, 170, 255, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--glass-border)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Upload style={{ width: "48px", height: "48px", color: "var(--foreground-muted)", margin: "0 auto 16px" }} />
              <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>
                Upload Contract or Legal Document
              </div>
              <div style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
                PDF, DOCX, or TXT files supported
              </div>
              <button
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "transparent",
                  color: "var(--foreground)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Choose File
              </button>
            </div>

            <div style={{ marginTop: "24px", fontSize: "13px", color: "var(--foreground-muted)" }}>
              <strong>Document review includes:</strong>
              <ul style={{ marginTop: "8px", paddingLeft: "20px", lineHeight: 1.7 }}>
                <li>Red flag identification</li>
                <li>Unusual or one-sided clauses</li>
                <li>Missing protections</li>
                <li>Jurisdiction and governing law analysis</li>
                <li>Termination and liability provisions</li>
              </ul>
            </div>
          </div>
        )}

        {/* Quick Examples */}
        <div style={{ marginTop: "32px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
            Common Questions
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[
              "What's the difference between LLC and S-Corp?",
              "Explain GDPR compliance requirements",
              "How do non-compete clauses work?",
              "What makes a contract legally binding?",
              "When do I need a patent vs copyright?",
            ].map((example) => (
              <button
                key={example}
                onClick={() => {
                  setActiveTab("question");
                  setQuestion(example);
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--glass-border)",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "var(--foreground-muted)",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 170, 255, 0.1)";
                  e.currentTarget.style.borderColor = "#00aaff";
                  e.currentTarget.style.color = "#00aaff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.borderColor = "var(--glass-border)";
                  e.currentTarget.style.color = "var(--foreground-muted)";
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
