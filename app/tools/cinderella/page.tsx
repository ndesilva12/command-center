"use client";

import { useState, useEffect } from "react";
import { Trophy, Target, Users, Building2, FileText, TrendingUp, ExternalLink } from "lucide-react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToolNav } from "@/components/tools/ToolNav";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function CinderellaPage() {
  return (
    <ProtectedRoute>
      <CinderellaContent />
    </ProtectedRoute>
  );
}

function CinderellaContent() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('cinderella', 'Cinderella Project', '#f59e0b');
  const [activeTab, setActiveTab] = useState<'overview' | 'targets' | 'contacts' | 'tasks' | 'financials'>('overview');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />
      <ToolNav currentToolId="cinderella" />
      <main
        style={{
          paddingTop: isMobile ? "64px" : "136px",
          paddingBottom: isMobile ? "88px" : "32px",
          paddingLeft: isMobile ? "12px" : "24px",
          paddingRight: isMobile ? "12px" : "24px",
          minHeight: "100vh",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Trophy style={{ width: "32px", height: "32px", color: "#f59e0b" }} />
            <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
              {toolCustom.name}
            </h1>
          </div>
          <p style={{ fontSize: "15px", color: "var(--foreground-muted)" }}>
            PE-backed NCAA basketball acquisition • UIC + Tim Grover • "Welcome to Wrexham" for college hoops
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: isMobile ? "8px" : "12px",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'targets', label: 'Targets', icon: Target },
            { id: 'contacts', label: 'Contacts', icon: Users },
            { id: 'tasks', label: 'Tasks', icon: FileText },
            { id: 'financials', label: 'Financials', icon: Building2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              style={{
                padding: isMobile ? "8px 16px" : "10px 20px",
                borderRadius: "8px",
                border: activeTab === id ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                background: activeTab === id ? "rgba(245, 158, 11, 0.1)" : "rgba(255, 255, 255, 0.03)",
                color: activeTab === id ? "#f59e0b" : "rgba(255, 255, 255, 0.7)",
                fontSize: isMobile ? "13px" : "14px",
                fontWeight: activeTab === id ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && <OverviewTab isMobile={isMobile} />}
        {activeTab === 'targets' && <TargetsTab isMobile={isMobile} />}
        {activeTab === 'contacts' && <ContactsTab isMobile={isMobile} />}
        {activeTab === 'tasks' && <TasksTab isMobile={isMobile} />}
        {activeTab === 'financials' && <FinancialsTab isMobile={isMobile} />}
      </main>
    </>
  );
}

function OverviewTab({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Status Card */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(245, 158, 11, 0.05)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#f59e0b", marginBottom: "12px" }}>
          🎯 Current Status
        </h2>
        <div style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.6 }}>
          <p><strong>First Target:</strong> Tim Grover + University of Illinois-Chicago (UIC)</p>
          <p><strong>VC Traction:</strong> Courtside VC, SC Holdings (both following up)</p>
          <p><strong>Phase:</strong> Pre-seed/seed discovery (VCs "soft circling")</p>
        </div>
      </div>

      {/* Economics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: "16px",
      }}>
        <StatCard
          label="Year 1 Investment"
          value="$13M"
          color="#3b82f6"
        />
        <StatCard
          label="Year 1 Revenue"
          value="$19M"
          color="#10b981"
        />
        <StatCard
          label="Year 1 Investor Return"
          value="$4.3M (33% ROI)"
          color="#f59e0b"
        />
      </div>

      {/* IRR Card */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
          📈 Exit IRR Scenarios
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Year 1 Exit</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#10b981" }}>264%</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Year 3 Exit</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#f59e0b" }}>91%</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>Year 5 Exit</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#3b82f6" }}>52%</div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
          🚀 Next Steps
        </h2>
        <ol style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.8, paddingLeft: "20px" }}>
          <li>Lock UIC + Grover (LOI/MOU)</li>
          <li>Build pre-term sheet package</li>
          <li>Launch celebrity outreach campaign</li>
          <li>Secure lead investor ($750K-$1M)</li>
        </ol>
      </div>

      {/* Workspace Link */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
          📁 Project Files
        </h2>
        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
          All project files are in the workspace at:
        </p>
        <code style={{
          display: "block",
          padding: "8px 12px",
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "6px",
          fontSize: "13px",
          color: "#00aaff",
          fontFamily: "monospace",
        }}>
          /home/ubuntu/.openclaw/workspace/cinderella/
        </code>
      </div>
    </div>
  );
}

function TargetsTab({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{
      padding: isMobile ? "16px" : "24px",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
        🎯 Celebrity Targets (99 Total)
      </h2>
      <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "20px" }}>
        View full targets database in TARGETS.md
      </p>

      {/* Priority Targets */}
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
        Top 10 Priority Targets
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[
          { name: "Tim Grover", school: "UIC", status: "🟡 In Talks", note: "MOU in progress" },
          { name: "Bill Simmons", school: "Holy Cross", status: "⚪ Not Contacted", note: "" },
          { name: "Denzel Washington", school: "Fordham", status: "⚪ Not Contacted", note: "" },
          { name: "Steph Curry", school: "Davidson", status: "⚪ Not Contacted", note: "" },
          { name: "Jon Stewart", school: "William & Mary", status: "⚪ Not Contacted", note: "" },
          { name: "Ben Affleck", school: "Vermont", status: "⚪ Not Contacted", note: "" },
          { name: "CJ McCollum", school: "Lehigh", status: "⚪ Not Contacted", note: "" },
          { name: "Liev Schreiber", school: "UMass", status: "⚪ Not Contacted", note: "" },
          { name: "Matt Damon", school: "Boston ties", status: "⚪ Not Contacted", note: "" },
          { name: "Dierks Bentley", school: "Vermont", status: "⚪ Not Contacted", note: "" },
        ].map((target, i) => (
          <div
            key={i}
            style={{
              padding: "12px 16px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>
                {target.name}
              </span>
              <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
                {target.status}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
              {target.school} {target.note && `• ${target.note}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactsTab({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
          🏢 Contact Database
        </h2>
        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "16px" }}>
          View full contact database in CONTACTS.md
        </p>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "12px" }}>
          <StatCard label="PE Groups" value="86" color="#3b82f6" />
          <StatCard label="Production Cos" value="12" color="#8b5cf6" />
          <StatCard label="People" value="115+" color="#10b981" />
        </div>
      </div>

      {/* Key PE Groups */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
          Top PE Groups
        </h3>
        <ul style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.8, paddingLeft: "20px" }}>
          <li>Sixth Street</li>
          <li>Arctos Partners</li>
          <li>RedBird Capital</li>
          <li>Courtside VC (following up)</li>
          <li>SC Holdings (following up)</li>
        </ul>
      </div>

      {/* Key Production Companies */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--foreground)", marginBottom: "12px" }}>
          Top Production Companies
        </h3>
        <ul style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.8, paddingLeft: "20px" }}>
          <li>Box to Box Films (Drive to Survive)</li>
          <li>Omaha Productions (Quarterback)</li>
          <li>Netflix Sports Division</li>
          <li>FX/Hulu</li>
        </ul>
      </div>
    </div>
  );
}

function TasksTab({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{
      padding: isMobile ? "16px" : "24px",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
        ✅ Task Tracker
      </h2>
      <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "20px" }}>
        View full task tracker in TASKS.md
      </p>

      {/* Priority 1 */}
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#f59e0b", marginBottom: "12px" }}>
        Priority 1: Lock UIC + Grover (THIS WEEK)
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
        <TaskItem task="Draft Grover commitment letter" status="🟡 In Progress" due="2026-02-17" />
        <TaskItem task="Schedule UIC athletic director call" status="⚪ Todo" due="2026-02-15" />
        <TaskItem task="Draft UIC MOU (non-binding)" status="⚪ Todo" due="2026-02-20" />
        <TaskItem task="Finalize Grover commitment" status="⚪ Todo" due="2026-02-20" />
      </div>

      {/* Priority 2 */}
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#3b82f6", marginBottom: "12px" }}>
        Priority 2: Pre-Term Sheet Package (NEXT 2 WEEKS)
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <TaskItem task="Build 1-page financial model" status="🟡 In Progress" due="2026-02-20" />
        <TaskItem task="Legal structure memo (2-pager)" status="⚪ Todo" due="2026-02-20" />
        <TaskItem task="Round structure slide" status="⚪ Todo" due="2026-02-18" />
        <TaskItem task="VC pitch update" status="⚪ Todo" due="2026-02-22" />
      </div>
    </div>
  );
}

function FinancialsTab({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Year 1 Model */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", marginBottom: "16px" }}>
          💰 Year 1 Financial Model
        </h2>

        {/* Revenue */}
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "8px" }}>
          Revenue Sources
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
          <FinancialRow label="Streaming/Media Rights" value="$4M" />
          <FinancialRow label="Jersey Sponsors" value="$2M" />
          <FinancialRow label="Sponsorships/Licensing" value="$5M" />
          <FinancialRow label="Donations" value="$4M" />
          <FinancialRow label="Conference Distribution" value="$1M" />
          <FinancialRow label="Ticket Sales" value="$1M" />
          <FinancialRow label="Other" value="$2M" />
          <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} />
          <FinancialRow label="TOTAL REVENUE" value="$19M" bold />
        </div>

        {/* Investment */}
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "8px" }}>
          Investment Uses
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <FinancialRow label="NIL/Player Compensation" value="$6M" />
          <FinancialRow label="Coaching/Staff" value="$1.5M" />
          <FinancialRow label="Scholarships" value="$950K" />
          <FinancialRow label="Facilities Upgrades" value="$1M" />
          <FinancialRow label="Recruiting" value="$800K" />
          <FinancialRow label="Operations" value="$2.75M" />
          <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.1)", margin: "8px 0" }} />
          <FinancialRow label="TOTAL INVESTMENT" value="$13M" bold />
        </div>
      </div>

      {/* Returns */}
      <div style={{
        padding: isMobile ? "16px" : "24px",
        borderRadius: "12px",
        background: "rgba(16, 185, 129, 0.05)",
        border: "1px solid rgba(16, 185, 129, 0.2)",
      }}>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#10b981", marginBottom: "12px" }}>
          📊 Returns
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <FinancialRow label="Net Profit" value="$6M" />
          <FinancialRow label="Investor Share (49%)" value="$2.94M" />
          <FinancialRow label="Investor Return" value="$4.3M" color="#10b981" bold />
          <FinancialRow label="ROI" value="33%" color="#10b981" bold />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: "16px",
      borderRadius: "8px",
      background: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
    }}>
      <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "20px", fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}

function TaskItem({ task, status, due }: { task: string; status: string; due: string }) {
  return (
    <div style={{
      padding: "10px 12px",
      background: "rgba(255, 255, 255, 0.03)",
      borderRadius: "6px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <div>
        <span style={{ fontSize: "14px", color: "var(--foreground)" }}>{task}</span>
        <span style={{ fontSize: "12px", color: "var(--foreground-muted)", marginLeft: "8px" }}>
          {status}
        </span>
      </div>
      <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
        {due}
      </span>
    </div>
  );
}

function FinancialRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
      <span style={{ color: "var(--foreground)", fontWeight: bold ? 600 : 400 }}>
        {label}
      </span>
      <span style={{ color: color || "var(--foreground)", fontWeight: bold ? 700 : 400 }}>
        {value}
      </span>
    </div>
  );
}
