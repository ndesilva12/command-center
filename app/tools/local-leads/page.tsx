"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useToolCustomizations } from "@/hooks/useToolCustomizations";
import { ToolBackground } from "@/components/tools/ToolBackground";
import { Search, Send, DollarSign, Users, Zap, Building2, Mail, ExternalLink, Trash2, ChevronRight } from "lucide-react";

// Strategic markets for each lead type - one metro, one rural per category
const LEAD_CATEGORIES = [
  { id: 'roofing-metro', label: 'Roofing', icon: '🏠', price: 30, market: 'Houston, TX', marketType: 'metro', reason: 'Hail storms, huge market' },
  { id: 'roofing-rural', label: 'Roofing', icon: '🏠', price: 30, market: 'Joplin, MO area', marketType: 'rural', reason: 'Tornado alley, less competition' },
  { id: 'plumbing-metro', label: 'Plumbing', icon: '🔧', price: 25, market: 'Phoenix, AZ', marketType: 'metro', reason: 'Hard water, pipe issues' },
  { id: 'plumbing-rural', label: 'Plumbing', icon: '🔧', price: 25, market: 'Prescott, AZ area', marketType: 'rural', reason: 'Older homes, retirees' },
  { id: 'hvac-metro', label: 'HVAC', icon: '❄️', price: 35, market: 'Dallas, TX', marketType: 'metro', reason: 'Extreme temps, AC demand' },
  { id: 'hvac-rural', label: 'HVAC', icon: '❄️', price: 35, market: 'Amarillo, TX area', marketType: 'rural', reason: 'Rural Texas, extreme temps' },
  { id: 'electrical-metro', label: 'Electrical', icon: '⚡', price: 25, market: 'Los Angeles, CA', marketType: 'metro', reason: 'Solar, EV chargers' },
  { id: 'electrical-rural', label: 'Electrical', icon: '⚡', price: 25, market: 'Bakersfield, CA area', marketType: 'rural', reason: 'Agricultural, solar farms' },
  { id: 'landscaping-metro', label: 'Landscaping', icon: '🌿', price: 20, market: 'Miami, FL', marketType: 'metro', reason: 'Year-round outdoor' },
  { id: 'landscaping-rural', label: 'Landscaping', icon: '🌿', price: 20, market: 'Naples, FL area', marketType: 'rural', reason: 'Wealthy retirees' },
  { id: 'cleaning-metro', label: 'Cleaning', icon: '✨', price: 20, market: 'San Francisco, CA', marketType: 'metro', reason: 'Busy professionals' },
  { id: 'cleaning-rural', label: 'Cleaning', icon: '✨', price: 20, market: 'Napa Valley, CA', marketType: 'rural', reason: 'Vacation homes, wine country' },
  { id: 'painting-metro', label: 'Painting', icon: '🎨', price: 20, market: 'Denver, CO', marketType: 'metro', reason: 'Housing boom' },
  { id: 'painting-rural', label: 'Painting', icon: '🎨', price: 20, market: 'Fort Collins, CO area', marketType: 'rural', reason: 'Growing suburbs' },
  { id: 'contractor-metro', label: 'General Contractor', icon: '🔨', price: 35, market: 'Atlanta, GA', marketType: 'metro', reason: 'Construction boom' },
  { id: 'contractor-rural', label: 'General Contractor', icon: '🔨', price: 35, market: 'Savannah, GA area', marketType: 'rural', reason: 'Historic homes, renovations' },
  { id: 'legal-pi-metro', label: 'Personal Injury', icon: '🩹', price: 75, market: 'Chicago, IL', marketType: 'metro', reason: 'High volume accidents' },
  { id: 'legal-pi-rural', label: 'Personal Injury', icon: '🩹', price: 75, market: 'Peoria, IL area', marketType: 'rural', reason: 'Regional accidents, trucking' },
  { id: 'legal-divorce-metro', label: 'Divorce/Family', icon: '💔', price: 50, market: 'Los Angeles, CA', marketType: 'metro', reason: 'High divorce rate' },
  { id: 'legal-divorce-rural', label: 'Divorce/Family', icon: '💔', price: 50, market: 'Riverside, CA area', marketType: 'rural', reason: 'Growing suburbs' },
  { id: 'legal-bankruptcy-metro', label: 'Bankruptcy', icon: '📉', price: 40, market: 'Detroit, MI', marketType: 'metro', reason: 'Economic challenges' },
  { id: 'legal-bankruptcy-rural', label: 'Bankruptcy', icon: '📉', price: 40, market: 'Flint, MI area', marketType: 'rural', reason: 'Industrial decline' },
  { id: 'legal-immigration-metro', label: 'Immigration', icon: '🌎', price: 60, market: 'Miami, FL', marketType: 'metro', reason: 'Immigration hub' },
  { id: 'legal-immigration-rural', label: 'Immigration', icon: '🌎', price: 60, market: 'McAllen, TX area', marketType: 'rural', reason: 'Border region' },
  { id: 'legal-criminal-metro', label: 'Criminal Defense', icon: '⚔️', price: 50, market: 'Houston, TX', marketType: 'metro', reason: 'High crime volume' },
  { id: 'legal-criminal-rural', label: 'Criminal Defense', icon: '⚔️', price: 50, market: 'Beaumont, TX area', marketType: 'rural', reason: 'Regional courts' },
  { id: 'legal-estate-metro', label: 'Estate Planning', icon: '📜', price: 40, market: 'Phoenix, AZ', marketType: 'metro', reason: 'Retiree population' },
  { id: 'legal-estate-rural', label: 'Estate Planning', icon: '📜', price: 40, market: 'Scottsdale, AZ area', marketType: 'rural', reason: 'Wealthy retirees' },
  { id: 'legal-employment-metro', label: 'Employment Law', icon: '👔', price: 50, market: 'New York, NY', marketType: 'metro', reason: 'Corporate hub' },
  { id: 'legal-employment-rural', label: 'Employment Law', icon: '👔', price: 50, market: 'Albany, NY area', marketType: 'rural', reason: 'State government' },
  { id: 'realtor-metro', label: 'Realtor', icon: '🏡', price: 25, market: 'Austin, TX', marketType: 'metro', reason: 'Hot real estate' },
  { id: 'realtor-rural', label: 'Realtor', icon: '🏡', price: 25, market: 'Fredericksburg, TX', marketType: 'rural', reason: 'Hill Country, vacation homes' },
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
  const [showCategoryModal, setShowCategoryModal] = useState(false);

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
      // Use API route instead of direct Firestore (more reliable)
      const res = await fetch('/api/local-leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setBusinesses(data.businesses || []);
      } else {
        console.error("API error:", res.status);
      }
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

  const selectedCat = activeCategory ? LEAD_CATEGORIES.find(c => c.id === activeCategory) : null;

  // Mobile category modal
  const CategoryModal = () => (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
      onClick={() => setShowCategoryModal(false)}
    >
      <div 
        style={{
          background: 'var(--background)',
          borderRadius: '16px 16px 0 0',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '16px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Select Category</h3>
          <button 
            onClick={() => setShowCategoryModal(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--foreground)' }}
          >×</button>
        </div>
        <button
          onClick={() => { setActiveCategory(null); setShowCategoryModal(false); }}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            background: !activeCategory ? toolCustom.color : 'var(--glass-bg)',
            color: !activeCategory ? '#fff' : 'var(--foreground)',
            textAlign: 'left',
            cursor: 'pointer',
            marginBottom: '8px',
            fontSize: '15px',
            fontWeight: 600
          }}
        >
          All Leads ({leads.length})
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {LEAD_CATEGORIES.map(cat => {
            const count = leads.filter(l => l.type === cat.id).length;
            const isRural = cat.marketType === 'rural';
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setShowCategoryModal(false); }}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  background: activeCategory === cat.id ? toolCustom.color : 'var(--glass-bg)',
                  color: activeCategory === cat.id ? '#fff' : 'var(--foreground)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{cat.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{cat.label}</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>{isRural ? '🌾' : '🏙️'} {count}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <TopNav />
      <Sidebar />
      <BottomNav />

      {/* Mobile Category Modal */}
      {isMobile && showCategoryModal && <CategoryModal />}

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
          {/* Mobile: Compact Header + Category Selector */}
          {isMobile && (
            <div className="glass card" style={{ padding: "12px" }}>
              {/* Stats Row */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <div style={{ flex: 1, padding: "10px", background: "var(--glass-bg)", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: toolCustom.color }}>${totalRevenue}</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)" }}>Revenue</div>
                </div>
                <div style={{ flex: 1, padding: "10px", background: "var(--glass-bg)", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>{totalLeads}</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)" }}>Leads</div>
                </div>
                <div style={{ flex: 1, padding: "10px", background: "var(--glass-bg)", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>{soldLeads}</div>
                  <div style={{ fontSize: "10px", color: "var(--muted)" }}>Sold</div>
                </div>
              </div>
              {/* Category Selector Button */}
              <button
                onClick={() => setShowCategoryModal(true)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1px solid var(--glass-border)",
                  background: toolCustom.color,
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "15px",
                  fontWeight: 600
                }}
              >
                <span>{selectedCat ? `${selectedCat.icon} ${selectedCat.label}` : '🎯 All Leads'}</span>
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Desktop: Left Panel: Categories */}
          {!isMobile && (
            <div style={{ 
              width: "280px",
              minWidth: "280px",
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
                    const isRural = cat.marketType === 'rural';
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
                          fontSize: "12px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{cat.icon} {cat.label}</span>
                          <span style={{ 
                            fontSize: "10px", 
                            padding: "2px 6px", 
                            borderRadius: "4px",
                            background: isRural ? "#f59e0b33" : "#3b82f633",
                            color: isRural ? "#f59e0b" : "#3b82f6"
                          }}>
                            {isRural ? 'RURAL' : 'METRO'}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px" }}>
                          {cat.market} • {count} leads
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
                  category={activeCategory ? LEAD_CATEGORIES.find(c => c.id === activeCategory) || null : null}
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
  category: { id: string; label: string; icon: string; price: number; market: string; marketType?: string; reason: string } | null;
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
  
  const [emailTemplate, setEmailTemplate] = useState(`Hi,

I found 3 leads for your [TYPE] practice in [MARKET]. Here's the first one free:

"[LEAD_TEXT]"
- Source: [SOURCE]

Pay $[PRICE]/lead for more: [PAYMENT_LINK]

- Norman`);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>📧 Email Template (editable)</h3>
        <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "12px" }}>
          Placeholders: [TYPE], [MARKET], [LEAD_TEXT], [SOURCE], [PRICE], [PAYMENT_LINK]
        </p>
        <textarea
          value={emailTemplate}
          onChange={(e) => setEmailTemplate(e.target.value)}
          style={{
            width: "100%",
            minHeight: "180px",
            padding: "12px",
            background: "var(--glass-bg)",
            borderRadius: "8px",
            border: "1px solid var(--glass-border)",
            fontSize: "13px",
            fontFamily: "inherit",
            color: "var(--foreground)",
            resize: "vertical"
          }}
        />
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
