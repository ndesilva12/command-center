"use client";

import { useState, useEffect, useRef } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Send, Plus, Trash2, Upload, Loader2, CheckCircle, AlertCircle, X, Eye, RotateCcw, Clock } from "lucide-react";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";

const SENDERS = [
  "norman.desilva@gmail.com",
  "normancdesilva@gmail.com",
  "norman@listid.us",
];

interface Recipient {
  name: string;
  email: string;
}

interface SendResult {
  index: number;
  name: string;
  email: string;
  status: string;
  detail?: string;
  subject?: string;
}

interface HistoryEntry {
  id: string;
  sender: string;
  subject: string;
  recipientCount: number;
  dryRun: boolean;
  createdAt: string;
  sentCount?: number;
  failedCount?: number;
}

export default function EmailerPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization("emailer", "Emailer", "#3b82f6");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tab, setTab] = useState<"compose" | "history">("compose");
  const [sender, setSender] = useState(SENDERS[0]);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([{ name: "", email: "" }]);
  const [isMobile, setIsMobile] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const validRecipients = recipients.filter((r) => r.name.trim() && r.email.trim());

  const addRecipient = () => setRecipients([...recipients, { name: "", email: "" }]);

  const removeRecipient = (i: number) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((_, idx) => idx !== i));
  };

  const updateRecipient = (i: number, field: "name" | "email", value: string) => {
    const updated = [...recipients];
    updated[i] = { ...updated[i], [field]: value };
    setRecipients(updated);
  };

  const handleImport = () => {
    const lines = importText.split("\n").filter((l) => l.trim());
    const imported: Recipient[] = [];
    for (const line of lines) {
      const parts = line.split(/[,\t]+/).map((s) => s.trim());
      if (parts.length >= 2) {
        const email = parts.find((p) => p.includes("@")) || parts[1];
        const name = parts.find((p) => !p.includes("@")) || parts[0];
        if (email && name) imported.push({ name, email });
      }
    }
    if (imported.length) {
      const existing = recipients.filter((r) => r.name.trim() || r.email.trim());
      setRecipients([...existing, ...imported]);
    }
    setShowImportModal(false);
    setImportText("");
  };

  const bodyToHtml = (text: string) =>
    text
      .split("\n")
      .map((line) => `<p>${line || "&nbsp;"}</p>`)
      .join("");

  const handleReview = async () => {
    try {
      const res = await fetch("/api/emailer/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body_html: bodyToHtml(bodyText),
          recipients: validRecipients,
        }),
      });
      const data = await res.json();
      setPreviewHtml(data.html || "");
    } catch {}
    setStep(2);
  };

  const handleSend = async (dryRun = false, testToMe = false) => {
    setSending(true);
    setResults([]);
    setSummary(null);
    setStep(3);

    const sendRecipients = testToMe
      ? [{ name: "Norman", email: sender }]
      : validRecipients;

    try {
      const res = await fetch("/api/emailer/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender,
          subject,
          body_text: bodyText,
          body_html: bodyToHtml(bodyText),
          recipients: sendRecipients,
          dry_run: dryRun,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.summary) {
              setSummary(data.summary);
            } else if (data.done) {
              // stream ended
            } else if (data.index) {
              setResults((prev) => [...prev, data]);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setResults((prev) => [
        ...prev,
        { index: 0, name: "Error", email: "", status: "FAILED", detail: err.message },
      ]);
    }
    setSending(false);
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { collection, getDocs, orderBy, query: fbQuery } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const q = fbQuery(collection(db, "emailer_history"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const entries: HistoryEntry[] = [];
      snapshot.forEach((doc) => entries.push({ id: doc.id, ...doc.data() } as HistoryEntry));
      setHistory(entries);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab]);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "var(--foreground)",
    fontSize: "14px",
    outline: "none",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "white",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const btnSecondary: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "var(--foreground)",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const glassCard: React.CSSProperties = {
    padding: isMobile ? "20px" : "32px",
    borderRadius: "16px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    marginBottom: "24px",
  };

  const progressPercent = validRecipients.length
    ? Math.round((results.length / validRecipients.length) * 100)
    : 0;

  return (
    <ProtectedRoute requiredPermission="emailer">
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="emailer" />
      <ToolBackground color={toolCustom.color} />

      <main
        style={{
          paddingTop: isMobile ? "64px" : "136px",
          paddingBottom: isMobile ? "80px" : "96px",
          minHeight: `calc(100vh - ${isMobile ? "160px" : "232px"})`,
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: isMobile ? "0 12px" : "0 24px" }}>
          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Send style={{ width: "32px", height: "32px", color: toolCustom.color }} />
              <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
                {toolCustom.name}
              </h1>
            </div>
            <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
              Send personalized bulk emails
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            {(["compose", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); if (t === "compose") setStep(1); }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: tab === t ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                  background: tab === t ? "rgba(59, 130, 246, 0.1)" : "rgba(255, 255, 255, 0.03)",
                  color: tab === t ? "#3b82f6" : "var(--foreground-muted)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {t === "compose" ? <Send style={{ width: "14px", height: "14px" }} /> : <Clock style={{ width: "14px", height: "14px" }} />}
                {t === "compose" ? "Compose" : "History"}
              </button>
            ))}
          </div>

          {/* HISTORY TAB */}
          {tab === "history" && (
            <div>
              {historyLoading ? (
                <div style={{ ...glassCard, textAlign: "center", padding: "48px" }}>
                  <Loader2 style={{ width: "32px", height: "32px", color: "#3b82f6", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                </div>
              ) : history.length === 0 ? (
                <div style={{ ...glassCard, textAlign: "center", padding: "48px" }}>
                  <Clock style={{ width: "48px", height: "48px", color: "#3b82f6", margin: "0 auto 16px" }} />
                  <p style={{ color: "var(--foreground-muted)" }}>No email batches sent yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {history.map((h) => (
                    <div key={h.id} style={glassCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", margin: "0 0 4px" }}>{h.subject}</p>
                          <p style={{ fontSize: "13px", color: "var(--foreground-muted)", margin: "0 0 8px" }}>From: {h.sender}</p>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "4px", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                            {h.recipientCount} recipients
                          </span>
                          {h.dryRun && (
                            <span style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "4px", backgroundColor: "rgba(234, 179, 8, 0.1)", color: "#eab308", border: "1px solid rgba(234, 179, 8, 0.3)" }}>
                              Dry Run
                            </span>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--foreground-muted)", margin: 0 }}>
                        {new Date(h.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMPOSE TAB */}
          {tab === "compose" && step === 1 && (
            <>
              <div style={glassCard}>
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "24px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.15)" }}>
                  💡 Use <code style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>[first name]</code> to personalize. Signature is added automatically.
                </p>

                {/* Sender */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>From</label>
                  <select value={sender} onChange={(e) => setSender(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {SENDERS.map((s) => (
                      <option key={s} value={s} style={{ backgroundColor: "#1a1a2e" }}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>Subject</label>
                  <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quick question, [first name]" style={inputStyle} />
                </div>

                {/* Body */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>Body</label>
                  <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Hi [first name],&#10;&#10;..." rows={8} style={{ ...inputStyle, resize: "vertical", lineHeight: "1.6" }} />
                </div>
              </div>

              {/* Recipients */}
              <div style={glassCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
                    Recipients
                    <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--foreground-muted)", marginLeft: "8px" }}>
                      ({validRecipients.length})
                    </span>
                  </h2>
                  <button onClick={() => setShowImportModal(true)} style={btnSecondary}>
                    <Upload style={{ width: "14px", height: "14px" }} /> Bulk Import
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {recipients.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => updateRecipient(i, "name", e.target.value)}
                        placeholder="Name"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <input
                        type="email"
                        value={r.email}
                        onChange={(e) => updateRecipient(i, "email", e.target.value)}
                        placeholder="email@example.com"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        onClick={() => removeRecipient(i)}
                        style={{ padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "var(--foreground-muted)", cursor: "pointer", flexShrink: 0 }}
                      >
                        <Trash2 style={{ width: "16px", height: "16px" }} />
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={addRecipient} style={{ ...btnSecondary, marginTop: "12px" }}>
                  <Plus style={{ width: "14px", height: "14px" }} /> Add Recipient
                </button>
              </div>

              {/* Review Button */}
              <button
                onClick={handleReview}
                disabled={!subject.trim() || !bodyText.trim() || validRecipients.length === 0}
                style={{
                  ...btnPrimary,
                  width: "100%",
                  justifyContent: "center",
                  padding: "16px",
                  fontSize: "16px",
                  opacity: !subject.trim() || !bodyText.trim() || validRecipients.length === 0 ? 0.4 : 1,
                  cursor: !subject.trim() || !bodyText.trim() || validRecipients.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                <Eye style={{ width: "18px", height: "18px" }} /> Review & Confirm
              </button>
            </>
          )}

          {/* STEP 2: Confirmation */}
          {tab === "compose" && step === 2 && (
            <div style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.85)", overflowY: "auto", padding: isMobile ? "16px" : "40px" }}>
              <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <div style={{ ...glassCard, backgroundColor: "rgba(20, 20, 40, 0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--foreground)", marginBottom: "24px" }}>Review & Confirm</h2>

                  {/* Summary */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                    {[
                      { label: "From", value: sender },
                      { label: "Subject", value: subject },
                      { label: "Recipients", value: `${validRecipients.length}` },
                    ].map((item) => (
                      <div key={item.label} style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <p style={{ fontSize: "12px", color: "var(--foreground-muted)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
                        <p style={{ fontSize: "14px", color: "var(--foreground)", margin: 0, fontWeight: 600, wordBreak: "break-all" }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recipient Table */}
                  <div style={{ marginBottom: "24px", maxHeight: "200px", overflowY: "auto", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                          <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>#</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>Name</th>
                          <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--foreground-muted)", fontWeight: 600 }}>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validRecipients.map((r, i) => (
                          <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            <td style={{ padding: "8px 12px", color: "var(--foreground-muted)" }}>{i + 1}</td>
                            <td style={{ padding: "8px 12px", color: "var(--foreground)" }}>{r.name}</td>
                            <td style={{ padding: "8px 12px", color: "var(--foreground)" }}>{r.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Email Preview */}
                  {previewHtml && (
                    <div style={{ marginBottom: "24px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)", marginBottom: "8px" }}>Preview (personalized for {validRecipients[0]?.name})</p>
                      <div
                        style={{ padding: "20px", borderRadius: "8px", backgroundColor: "white", color: "black", maxHeight: "300px", overflowY: "auto" }}
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button onClick={() => setStep(1)} style={btnSecondary}>← Edit</button>
                    <button onClick={() => handleSend(false, true)} style={btnSecondary}>
                      <Send style={{ width: "14px", height: "14px" }} /> Send Test to Me
                    </button>
                    <button onClick={() => handleSend(false)} style={{ ...btnPrimary, flex: 1, justifyContent: "center" }}>
                      <Send style={{ width: "16px", height: "16px" }} /> Send All ({validRecipients.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Progress */}
          {tab === "compose" && step === 3 && (
            <div>
              <div style={glassCard}>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
                  {sending ? "Sending..." : "Complete"}
                </h2>

                {/* Progress Bar */}
                <div style={{ height: "8px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.06)", marginBottom: "20px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${summary ? 100 : progressPercent}%`,
                      borderRadius: "4px",
                      background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* Results */}
                <div ref={resultsRef} style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {results.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        backgroundColor: r.status === "SENT" || r.status === "DRY_RUN"
                          ? "rgba(16, 185, 129, 0.06)"
                          : "rgba(239, 68, 68, 0.06)",
                        border: `1px solid ${r.status === "SENT" || r.status === "DRY_RUN" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
                      }}
                    >
                      {r.status === "SENT" || r.status === "DRY_RUN" ? (
                        <CheckCircle style={{ width: "16px", height: "16px", color: "#10b981", flexShrink: 0 }} />
                      ) : (
                        <AlertCircle style={{ width: "16px", height: "16px", color: "#ef4444", flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: "13px", color: "var(--foreground)", flex: 1 }}>
                        {r.name} ({r.email})
                      </span>
                      <span style={{ fontSize: "12px", color: r.status === "SENT" || r.status === "DRY_RUN" ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                  {sending && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px" }}>
                      <Loader2 style={{ width: "16px", height: "16px", color: "#3b82f6", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>Sending...</span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {summary && (
                  <div style={{ marginTop: "20px", padding: "16px", borderRadius: "8px", backgroundColor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", margin: "0 0 8px" }}>
                      ✅ Complete
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--foreground-muted)", margin: 0 }}>
                      Sent: {summary.sent} · Failed: {summary.failed} · Dry Run: {summary.dry_run} · Total: {summary.total}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {!sending && (
                  <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
                    <button onClick={() => { setStep(1); setResults([]); setSummary(null); }} style={btnSecondary}>
                      ← New Email
                    </button>
                    {summary && summary.failed > 0 && (
                      <button
                        onClick={() => {
                          const failedRecipients = results.filter((r) => r.status === "FAILED").map((r) => ({ name: r.name, email: r.email }));
                          setRecipients(failedRecipients);
                          setStep(1);
                          setResults([]);
                          setSummary(null);
                        }}
                        style={btnSecondary}
                      >
                        <RotateCcw style={{ width: "14px", height: "14px" }} /> Retry Failed ({summary.failed})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ maxWidth: "500px", width: "100%", padding: "28px", borderRadius: "16px", backgroundColor: "rgba(20,20,40,0.98)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>Bulk Import</h3>
              <button onClick={() => setShowImportModal(false)} style={{ background: "none", border: "none", color: "var(--foreground-muted)", cursor: "pointer" }}>
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
            <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
              Paste CSV-style list (one per line): <code>Name, email@example.com</code>
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              placeholder={"John Smith, john@example.com\nJane Doe, jane@example.com"}
              style={{ ...inputStyle, resize: "vertical", marginBottom: "16px" }}
            />
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowImportModal(false)} style={btnSecondary}>Cancel</button>
              <button onClick={handleImport} style={btnPrimary}>
                <Upload style={{ width: "14px", height: "14px" }} /> Import
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ProtectedRoute>
  );
}
