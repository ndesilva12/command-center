"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, limit, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { Search, Send, DollarSign, Users, Zap, Building2, Mail, ExternalLink, Trash2, ChevronRight } from "lucide-react";

// Strategic markets for each lead type
const LEAD_CATEGORIES = [
  { id: 'roofing', label: 'Roofing', icon: '🏠', price: 30, market: 'Houston, TX', reason: 'Hail storms, huge market' },
  { id: 'plumbing', label: 'Plumbing', icon: '🔧', price: 25, market: 'Phoenix, AZ', reason: 'Hard water, pipe issues' },
  { id: 'hvac', label: 'HVAC', icon: '❄️', price: 35, market: 'Dallas, TX', reason: 'Extreme temps, AC demand' },
  { id: 'electrical', label: 'Electrical', icon: '⚡', price: 25, market: 'Los Angeles, CA', reason: 'Solar, EV chargers' },
  { id: 'landscaping', label: 'Landscaping', icon: '🌿', price: 20, market: 'Miami, FL', reason: 'Year-round outdoor' },
  { id: 'cleaning', label: 'Cleaning', icon: '✨', price: 20, market: 'San Francisco, CA', reason: 'Busy professionals' },
  { id: 'painting', label: 'Painting', icon: '🎨', price: 20, market: 'Denver, CO', reason: 'Housing boom' },
  { id: 'contractor', label: 'General Contractor', icon: '🔨', price: 35, market: 'Atlanta, GA', reason: 'Construction boom' },
  { id: 'legal', label: 'Legal', icon: '⚖️', price: 75, market: 'Chicago, IL', reason: 'High litigation' },
  { id: 'realtor', label: 'Realtor', icon: '🏡', price: 25, market: 'Austin, TX', reason: 'Hot real estate' },
];

interface Lead {
  id: string;
  type: string;
  text: string;
  author: string;
  town: string;
  market: string;
  url: string;
  source: string;
  status: 'new' | 'sent' | 'sold' | 'delivered';
  price?: number;
  discoveredAt: string;
}

interface Business {
  id: string;
  name: string;
  type: string;
  market: string;
  email: string;
  phone?: string;
  status: 'prospect' | 'contacted' | 'active';
  pricePerLead?: number;
}

export default function LocalLeadsPage() {
  const { getCustomization } = useToolCustomizations();
  const toolCustom = getCustomization('local-leads', 'Local Leads', '#22c55e');
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tab, setTab] = useState<'leads' | 'businesses' | 'outreach'>('leads');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load leads
      const leadsQ = query(collection(db, "local_leads"), orderBy("discoveredAt", "desc"), limit(100));
      const leadsSnap = await getDocs(leadsQ);
      setLeads(leadsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));

      // Load businesses
      const bizQ = query(collection(db, "local_leads_businesses"), orderBy("name"));
      const bizSnap = await getDocs(bizQ);
      setBusinesses(bizSnap.docs.map(d => ({ id: d.id, ...d.data() } as Business)));
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const runDiscovery = async (categoryId: string) => {
    setDiscovering(true);
    const cat = LEAD_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return;

    try {
      const res = await fetch('/api/local-leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          types: [categoryId], 
          market: cat.market,
          searchTerms: [`${cat.label} ${cat.market}`, `need ${cat.id} ${cat.market}`]
        })
      });
      const data = await res.json();
      alert(`Found ${data.newLeads || 0} new leads in ${cat.market}`);
      loadData();
    } catch (err) {
      console.error("Discovery failed:", err);
    } finally {
      setDiscovering(false);
    }
  };

  // Stats
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const soldLeads = leads.filter(l => l.status === 'sold' || l.status === 'delivered').length;
  const totalRevenue = leads.filter(l => l.status === 'sold' || l.status === 'delivered').reduce((sum, l) => sum + (l.price || 0), 0);
  const activeBusinesses = businesses.filter(b => b.status === 'active').length;

  const filteredLeads = activeCategory 
    ? leads.filter(l => l.type === activeCategory)
    : leads;

  return (
    <>
      <TopNav />
      <Sidebar />
      <BottomNav />

      <main
        style={{
          flex: 1,
          minHeight: "100vh",
          paddingTop: isMobile ? "64px" : "68px",
          paddingBottom: isMobile ? "80px" : "16px",
          paddingLeft: isMobile ? "8px" : "calc(var(--sidebar-width, 240px) + 8px)",
          paddingRight: isMobile ? "8px" : "8px",
        }}
      >
        <ToolBackground color={toolCustom.color} />

        <div style={{ 
          display: "flex", 
          flexDirection: isMobile ? "column" : "row",
          gap: "12px",
          height: isMobile ? "auto" : "calc(100vh - 84px)",
        }}>
          {/* Left Panel: Categories */}
          <div style={{ 
            width: isMobile ? "100%" : "280px",
            minWidth: isMobile ? "100%" : "280px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            {/* Header */}
            <div className="glass card" style={{ padding: "16px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ color: toolCustom.color }}>🎯</span> {toolCustom.name}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "16px" }}>
                AI-powered lead generation
              </p>

              {/* Quick Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ padding: "12px", background: "var(--glass-bg)", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: toolCustom.color }}>${totalRevenue}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>Revenue</div>
                </div>
                <div style={{ padding: "12px", background: "var(--glass-bg)", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>{totalLeads}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>Leads</div>
                </div>
                <div style={{ padding: "12px", background: "var(--glass-bg)", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>{soldLeads}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>Sold</div>
                </div>
                <div style={{ padding: "12px", background: "var(--glass-bg)", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>{activeBusinesses}</div>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>Buyers</div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="glass card" style={{ padding: "12px", flex: 1, overflow: "auto" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "12px", color: "var(--muted)" }}>
                CATEGORIES
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                  onClick={() => setActiveCategory(null)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: !activeCategory ? toolCustom.color : "transparent",
                    color: !activeCategory ? "#fff" : "var(--foreground)",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px"
                  }}
                >
                  <span>All Leads</span>
                  <span style={{ opacity: 0.7 }}>{leads.length}</span>
                </button>
                {LEAD_CATEGORIES.map(cat => {
                  const count = leads.filter(l => l.type === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--glass-border)",
                        background: activeCategory === cat.id ? toolCustom.color : "transparent",
                        color: activeCategory === cat.id ? "#fff" : "var(--foreground)",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "13px"
                      }}
                    >
                      <span>{cat.icon} {cat.label}</span>
                      <span style={{ opacity: 0.7, fontSize: "12px" }}>{cat.market.split(',')[0]} • {count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden" }}>
            {/* Tabs */}
            <div className="glass card" style={{ padding: "8px", display: "flex", gap: "8px" }}>
              {(['leads', 'businesses', 'outreach'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "6px",
                    border: "none",
                    background: tab === t ? toolCustom.color : "transparent",
                    color: tab === t ? "#fff" : "var(--muted)",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    textTransform: "capitalize"
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="glass card" style={{ flex: 1, padding: "16px", overflow: "auto" }}>
              {tab === 'leads' && (
                <LeadsPanel 
                  leads={filteredLeads} 
                  category={activeCategory ? LEAD_CATEGORIES.find(c => c.id === activeCategory) : null}
                  onDiscover={() => activeCategory && runDiscovery(activeCategory)}
                  discovering={discovering}
                  toolColor={toolCustom.color}
                />
              )}
              {tab === 'businesses' && (
                <BusinessesPanel 
                  businesses={businesses}
                  onRefresh={loadData}
                  toolColor={toolCustom.color}
                />
              )}
              {tab === 'outreach' && (
                <OutreachPanel 
                  businesses={businesses}
                  toolColor={toolCustom.color}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function LeadsPanel({ leads, category, onDiscover, discovering, toolColor }: {
  leads: Lead[];
  category: typeof LEAD_CATEGORIES[0] | null;
  onDiscover: () => void;
  discovering: boolean;
  toolColor: string;
}) {
  if (leads.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
        <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>No leads yet</h3>
        <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "20px" }}>
          {category ? `Find ${category.label.toLowerCase()} leads in ${category.market}` : 'Select a category to start'}
        </p>
        {category && (
          <button
            onClick={onDiscover}
            disabled={discovering}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              background: toolColor,
              color: "#fff",
              fontWeight: 600,
              cursor: discovering ? "not-allowed" : "pointer"
            }}
          >
            {discovering ? "Searching..." : `Find ${category.label} Leads`}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {category && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{category.icon} {category.label}</h3>
            <p style={{ fontSize: "12px", color: "var(--muted)" }}>{category.market} • ${category.price}/lead</p>
          </div>
          <button
            onClick={onDiscover}
            disabled={discovering}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: toolColor,
              color: "#fff",
              fontWeight: 600,
              fontSize: "13px",
              cursor: discovering ? "not-allowed" : "pointer"
            }}
          >
            {discovering ? "..." : "Find More"}
          </button>
        </div>
      )}
      {leads.map(lead => (
        <div key={lead.id} style={{
          padding: "12px",
          background: "var(--glass-bg)",
          borderRadius: "8px",
          border: "1px solid var(--glass-border)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", marginBottom: "6px" }}>{lead.text}</p>
              <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--muted)" }}>
                <span>{lead.market || lead.town}</span>
                <span>{lead.source}</span>
              </div>
            </div>
            <span style={{
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              background: lead.status === 'new' ? '#eab308' : lead.status === 'sold' ? '#22c55e' : '#6b7280',
              color: '#fff'
            }}>
              {lead.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BusinessesPanel({ businesses, onRefresh, toolColor }: {
  businesses: Business[];
  onRefresh: () => void;
  toolColor: string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newBiz, setNewBiz] = useState({ name: '', type: 'roofing', market: 'Houston, TX', email: '', phone: '' });

  const addBusiness = async () => {
    try {
      await addDoc(collection(db, "local_leads_businesses"), {
        ...newBiz,
        status: 'prospect',
        pricePerLead: LEAD_CATEGORIES.find(c => c.id === newBiz.type)?.price || 25,
        createdAt: new Date().toISOString()
      });
      setShowAdd(false);
      setNewBiz({ name: '', type: 'roofing', market: 'Houston, TX', email: '', phone: '' });
      onRefresh();
    } catch (err) {
      console.error("Failed to add business:", err);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowAdd(!showAdd)}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          background: toolColor,
          color: "#fff",
          fontWeight: 600,
          marginBottom: "16px",
          cursor: "pointer"
        }}
      >
        + Add Business
      </button>

      {showAdd && (
        <div style={{ padding: "16px", background: "var(--glass-bg)", borderRadius: "8px", border: "1px solid var(--glass-border)", marginBottom: "16px" }}>
          <input
            placeholder="Business Name"
            value={newBiz.name}
            onChange={e => setNewBiz({ ...newBiz, name: e.target.value })}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--glass-border)", background: "transparent", color: "var(--foreground)", marginBottom: "8px" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
            <select
              value={newBiz.type}
              onChange={e => {
                const cat = LEAD_CATEGORIES.find(c => c.id === e.target.value);
                setNewBiz({ ...newBiz, type: e.target.value, market: cat?.market || '' });
              }}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--glass-border)", background: "var(--glass-bg)", color: "var(--foreground)" }}
            >
              {LEAD_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <input
              placeholder="Market"
              value={newBiz.market}
              onChange={e => setNewBiz({ ...newBiz, market: e.target.value })}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid var(--glass-border)", background: "transparent", color: "var(--foreground)" }}
            />
          </div>
          <input
            placeholder="Email"
            value={newBiz.email}
            onChange={e => setNewBiz({ ...newBiz, email: e.target.value })}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--glass-border)", background: "transparent", color: "var(--foreground)", marginBottom: "8px" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid var(--glass-border)", background: "transparent", color: "var(--foreground)", cursor: "pointer" }}>Cancel</button>
            <button onClick={addBusiness} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", background: toolColor, color: "#fff", cursor: "pointer" }}>Save</button>
          </div>
        </div>
      )}

      {businesses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          <Building2 size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
          <p>No businesses yet. Add your first prospect.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {businesses.map(biz => (
            <div key={biz.id} style={{
              padding: "12px",
              background: "var(--glass-bg)",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{biz.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--muted)" }}>{biz.type} • {biz.market}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: toolColor, fontWeight: 600 }}>${biz.pricePerLead}/lead</div>
                  <span style={{
                    fontSize: "11px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: biz.status === 'active' ? '#22c55e33' : '#6b728033',
                    color: biz.status === 'active' ? '#22c55e' : '#9ca3af'
                  }}>{biz.status}</span>
                </div>
              </div>
              {biz.email && (
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  <a href={`mailto:${biz.email}`} style={{ color: "#3b82f6" }}>{biz.email}</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OutreachPanel({ businesses, toolColor }: { businesses: Business[]; toolColor: string }) {
  const prospects = businesses.filter(b => b.status === 'prospect' || b.status === 'contacted');

  const emailTemplate = `Hi,

I used AI to find a lead for you. Here's the first one free.

Pay $X per lead here: [LINK]

Let me know if you have questions.

- Norman`;

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>📧 Outreach Template</h3>
        <pre style={{
          padding: "16px",
          background: "var(--glass-bg)",
          borderRadius: "8px",
          border: "1px solid var(--glass-border)",
          fontSize: "13px",
          whiteSpace: "pre-wrap",
          fontFamily: "inherit"
        }}>
          {emailTemplate}
        </pre>
        <button
          onClick={() => { navigator.clipboard.writeText(emailTemplate); alert('Copied!'); }}
          style={{
            marginTop: "8px",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "1px solid var(--glass-border)",
            background: "transparent",
            color: "var(--foreground)",
            cursor: "pointer",
            fontSize: "12px"
          }}
        >
          Copy Template
        </button>
      </div>

      <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>📋 Prospects ({prospects.length})</h3>
      {prospects.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: "13px" }}>Add businesses to start outreach</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {prospects.map(biz => (
            <div key={biz.id} style={{
              padding: "12px",
              background: "var(--glass-bg)",
              borderRadius: "8px",
              border: "1px solid var(--glass-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{biz.name}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)" }}>{biz.type} • {biz.market}</div>
              </div>
              {biz.email && (
                <a
                  href={`mailto:${biz.email}?subject=Free ${biz.type} lead for you&body=${encodeURIComponent(emailTemplate.replace('$X', String(biz.pricePerLead || 25)))}`}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    background: toolColor,
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 600
                  }}
                >
                  Email
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
