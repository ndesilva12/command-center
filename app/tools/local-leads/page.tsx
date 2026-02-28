'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target, TrendingUp, Users, DollarSign, Clock, Search, Building2, Mail, Phone, ExternalLink, Plus, ChevronRight, Zap, MapPin } from 'lucide-react';

interface Lead {
  id: string;
  source: 'x' | 'reddit' | 'facebook';
  type: string;
  text: string;
  author: string;
  location: string;
  town: string;
  url: string;
  status: 'new' | 'contacted' | 'sold' | 'delivered' | 'expired';
  soldTo?: string;
  price?: number;
  discoveredAt: string;
  soldAt?: string;
}

interface Business {
  id: string;
  name: string;
  type: string;
  town: string;
  email: string;
  phone?: string;
  website?: string;
  status: 'prospect' | 'contacted' | 'negotiating' | 'active' | 'churned';
  pricePerLead?: number;
  totalLeadsBought: number;
  totalRevenue: number;
  lastContact?: string;
  notes?: string;
}

interface Stats {
  leadsFound: number;
  leadsSold: number;
  totalRevenue: number;
  activeBusinesses: number;
  conversionRate: number;
}

const TOWNS = [
  'Wellesley', 'Needham', 'Natick', 'Dover', 'Medfield', 'Millis', 'Medway',
  'Franklin', 'Bellingham', 'Mansfield', 'Norton', 'Taunton', 'Raynham',
  'Bridgewater', 'Middleboro', 'Lakeville', 'Rochester', 'Marion',
  'Mattapoisett', 'Fairhaven', 'New Bedford', 'Dartmouth'
];

const LEAD_TYPES = [
  { id: 'roofing', label: 'Roofing', price: 30, icon: '🏠' },
  { id: 'plumbing', label: 'Plumbing', price: 25, icon: '🔧' },
  { id: 'hvac', label: 'HVAC', price: 35, icon: '❄️' },
  { id: 'electrical', label: 'Electrical', price: 25, icon: '⚡' },
  { id: 'landscaping', label: 'Landscaping', price: 20, icon: '🌿' },
  { id: 'cleaning', label: 'Cleaning', price: 20, icon: '✨' },
  { id: 'painting', label: 'Painting', price: 20, icon: '🎨' },
  { id: 'contractor', label: 'Contractor', price: 35, icon: '🔨' },
  { id: 'legal', label: 'Legal', price: 75, icon: '⚖️' },
  { id: 'realtor', label: 'Realtor', price: 25, icon: '🏡' },
];

export default function LocalLeadsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'businesses' | 'outreach'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<Stats>({ leadsFound: 0, leadsSold: 0, totalRevenue: 0, activeBusinesses: 0, conversionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [discoveryRunning, setDiscoveryRunning] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/local-leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setBusinesses(data.businesses || []);
        setStats(data.stats || { leadsFound: 0, leadsSold: 0, totalRevenue: 0, activeBusinesses: 0, conversionRate: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch local leads data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runDiscovery = async () => {
    setDiscoveryRunning(true);
    try {
      const res = await fetch('/api/local-leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ towns: TOWNS, types: LEAD_TYPES.map(t => t.id) })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Discovery complete! Found ${data.newLeads} new leads.`);
        fetchData();
      }
    } catch (err) {
      console.error('Discovery failed:', err);
    } finally {
      setDiscoveryRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading Local Leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-green-600/20 via-emerald-600/10 to-teal-600/20 border-b border-green-500/20">
        <div className="px-4 py-6 md:px-6 md:py-8">
          {/* Title Row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <Target className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                  Local Leads
                </h1>
                <p className="text-sm text-gray-400">MA South Shore • Wellesley → Dartmouth</p>
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-gray-900/60 backdrop-blur rounded-2xl p-4 mb-4 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-3xl md:text-4xl font-bold text-green-400">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <button
                onClick={runDiscovery}
                disabled={discoveryRunning}
                className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-green-500/25 disabled:shadow-none flex items-center gap-2"
              >
                {discoveryRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Find Leads</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickStat icon={<Zap className="w-4 h-4" />} label="Leads Found" value={stats.leadsFound} color="blue" />
            <QuickStat icon={<TrendingUp className="w-4 h-4" />} label="Leads Sold" value={stats.leadsSold} color="green" />
            <QuickStat icon={<Building2 className="w-4 h-4" />} label="Active Buyers" value={stats.activeBusinesses} color="purple" />
            <QuickStat icon={<Clock className="w-4 h-4" />} label="New Today" value={leads.filter(l => l.status === 'new').length} color="yellow" />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-6 flex gap-1 overflow-x-auto pb-0 -mb-px">
          {(['dashboard', 'leads', 'businesses', 'outreach'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 rounded-t-xl font-medium text-sm transition-all whitespace-nowrap capitalize ${
                activeTab === tab
                  ? 'bg-gray-900 text-green-400 border-t border-l border-r border-green-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-6">
        {activeTab === 'dashboard' && <DashboardTab stats={stats} leads={leads} businesses={businesses} />}
        {activeTab === 'leads' && <LeadsTab leads={leads} businesses={businesses} onRefresh={fetchData} />}
        {activeTab === 'businesses' && <BusinessesTab businesses={businesses} onRefresh={fetchData} />}
        {activeTab === 'outreach' && <OutreachTab businesses={businesses} />}
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-3`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function DashboardTab({ stats, leads, businesses }: { stats: Stats; leads: Lead[]; businesses: Business[] }) {
  const recentLeads = leads.slice(0, 5);
  const activeBusinesses = businesses.filter(b => b.status === 'active');
  const newLeads = leads.filter(l => l.status === 'new');

  return (
    <div className="space-y-6">
      {/* Pipeline */}
      <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-4 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Lead Pipeline
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { status: 'new', label: 'New', color: 'yellow' },
            { status: 'contacted', label: 'Contacted', color: 'blue' },
            { status: 'sold', label: 'Sold', color: 'green' },
            { status: 'delivered', label: 'Delivered', color: 'purple' },
            { status: 'expired', label: 'Expired', color: 'gray' },
          ].map(({ status, label, color }) => {
            const count = leads.filter(l => l.status === status).length;
            const colorMap: Record<string, string> = {
              yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
              blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              green: 'bg-green-500/20 text-green-400 border-green-500/30',
              purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
              gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            };
            return (
              <div key={status} className={`flex-1 min-w-[80px] text-center p-3 rounded-xl border ${colorMap[color]}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs mt-1">{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-4 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Recent Leads
        </h3>
        {recentLeads.length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8" />}
            title="No leads yet"
            description="Hit 'Find Leads' to discover people looking for contractors in your area."
          />
        ) : (
          <div className="space-y-3">
            {recentLeads.map(lead => (
              <LeadCard key={lead.id} lead={lead} compact />
            ))}
          </div>
        )}
      </div>

      {/* Active Buyers */}
      <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-4 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-400" />
          Active Buyers
        </h3>
        {activeBusinesses.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No buyers yet"
            description="Add local businesses and start outreach to sign up lead buyers."
          />
        ) : (
          <div className="space-y-3">
            {activeBusinesses.map(biz => (
              <BusinessCard key={biz.id} business={biz} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 mb-4">
        {icon}
      </div>
      <h4 className="text-lg font-medium text-gray-300 mb-2">{title}</h4>
      <p className="text-sm text-gray-500 max-w-xs">{description}</p>
    </div>
  );
}

function LeadCard({ lead, compact = false }: { lead: Lead; compact?: boolean }) {
  const typeInfo = LEAD_TYPES.find(t => t.id === lead.type) || { icon: '📋', label: lead.type, price: 25 };
  const statusColors: Record<string, string> = {
    new: 'bg-yellow-500/20 text-yellow-400',
    contacted: 'bg-blue-500/20 text-blue-400',
    sold: 'bg-green-500/20 text-green-400',
    delivered: 'bg-purple-500/20 text-purple-400',
    expired: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{typeInfo.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm capitalize">{typeInfo.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[lead.status]}`}>
              {lead.status}
            </span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2">{lead.text}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {lead.town}
            </span>
            <span>{lead.source}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-green-400 font-semibold">${typeInfo.price}</p>
        </div>
      </div>
    </div>
  );
}

function BusinessCard({ business, compact = false }: { business: Business; compact?: boolean }) {
  const statusColors: Record<string, string> = {
    prospect: 'bg-gray-500/20 text-gray-400',
    contacted: 'bg-blue-500/20 text-blue-400',
    negotiating: 'bg-yellow-500/20 text-yellow-400',
    active: 'bg-green-500/20 text-green-400',
    churned: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{business.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[business.status]}`}>
              {business.status}
            </span>
          </div>
          <p className="text-sm text-gray-400">{business.type} • {business.town}</p>
        </div>
        <div className="text-right">
          <p className="text-green-400 font-semibold">${business.pricePerLead}/lead</p>
          <p className="text-xs text-gray-500">{business.totalLeadsBought} bought</p>
        </div>
      </div>
    </div>
  );
}

function LeadsTab({ leads, businesses, onRefresh }: { leads: Lead[]; businesses: Business[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<string>('all');

  const filteredLeads = leads.filter(l => filter === 'all' || l.status === filter);

  return (
    <div className="space-y-4">
      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'new', 'contacted', 'sold', 'delivered'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filter === status
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? 'All Leads' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Leads List */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="No leads found"
          description="Run discovery to find new leads or change your filter."
        />
      ) : (
        <div className="space-y-3">
          {filteredLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}

function BusinessesTab({ businesses, onRefresh }: { businesses: Business[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newBiz, setNewBiz] = useState({ name: '', type: 'roofing', town: 'Wellesley', email: '', phone: '', pricePerLead: 25 });

  const addBusiness = async () => {
    try {
      await fetch('/api/local-leads/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newBiz, status: 'prospect' })
      });
      setShowAdd(false);
      setNewBiz({ name: '', type: 'roofing', town: 'Wellesley', email: '', phone: '', pricePerLead: 25 });
      onRefresh();
    } catch (err) {
      console.error('Failed to add business:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-semibold flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Business
      </button>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-gray-900/80 backdrop-blur rounded-2xl p-4 border border-green-500/30 space-y-4">
          <input
            placeholder="Business Name"
            value={newBiz.name}
            onChange={e => setNewBiz({ ...newBiz, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 rounded-xl border border-gray-700 focus:border-green-500 outline-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newBiz.type}
              onChange={e => setNewBiz({ ...newBiz, type: e.target.value })}
              className="px-4 py-3 bg-gray-800 rounded-xl border border-gray-700"
            >
              {LEAD_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
            <select
              value={newBiz.town}
              onChange={e => setNewBiz({ ...newBiz, town: e.target.value })}
              className="px-4 py-3 bg-gray-800 rounded-xl border border-gray-700"
            >
              {TOWNS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <input
            placeholder="Email"
            type="email"
            value={newBiz.email}
            onChange={e => setNewBiz({ ...newBiz, email: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 rounded-xl border border-gray-700 focus:border-green-500 outline-none"
          />
          <input
            placeholder="Phone"
            value={newBiz.phone}
            onChange={e => setNewBiz({ ...newBiz, phone: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 rounded-xl border border-gray-700 focus:border-green-500 outline-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              onClick={addBusiness}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-medium"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Business List */}
      {businesses.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No businesses yet"
          description="Add local contractors to start selling leads."
        />
      ) : (
        <div className="space-y-3">
          {businesses.map(biz => (
            <div key={biz.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{biz.name}</h4>
                  <p className="text-sm text-gray-400 capitalize">{biz.type} • {biz.town}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  biz.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  biz.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>{biz.status}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {biz.email && (
                  <a href={`mailto:${biz.email}`} className="flex items-center gap-1 text-blue-400 hover:underline">
                    <Mail className="w-4 h-4" />
                    {biz.email}
                  </a>
                )}
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="flex items-center gap-1 text-gray-400">
                    <Phone className="w-4 h-4" />
                    {biz.phone}
                  </a>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                <span className="text-green-400 font-semibold">${biz.pricePerLead || 25}/lead</span>
                <span className="text-sm text-gray-500">{biz.totalLeadsBought || 0} leads bought • ${biz.totalRevenue || 0} revenue</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OutreachTab({ businesses }: { businesses: Business[] }) {
  const prospects = businesses.filter(b => b.status === 'prospect' || b.status === 'contacted');

  const emailTemplate = `Hi,

I run a local lead generation service for home service businesses in the Wellesley-to-Dartmouth corridor.

I find homeowners actively looking for help on Reddit, Facebook groups, and local forums - then sell those leads to contractors like you.

How it works:
• I send you the lead (name, contact, specific need, source)
• You only pay for leads you want
• $30/lead, no contracts, no minimums
• Exclusive OR shared pricing available

I have leads waiting now. Want me to send you a free sample?

Best,
Norman de Silva
normancdesilva@gmail.com`;

  return (
    <div className="space-y-6">
      {/* Prospects */}
      <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-4 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" />
          Prospects to Contact ({prospects.length})
        </h3>
        {prospects.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="No prospects"
            description="Add businesses to start outreach."
          />
        ) : (
          <div className="space-y-3">
            {prospects.map(biz => (
              <div key={biz.id} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50 flex items-center justify-between">
                <div>
                  <p className="font-medium">{biz.name}</p>
                  <p className="text-sm text-gray-400">{biz.type} • {biz.town}</p>
                </div>
                {biz.email ? (
                  <a
                    href={`mailto:${biz.email}?subject=Qualified ${biz.type} leads in ${biz.town} - $30 each&body=${encodeURIComponent(emailTemplate)}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                ) : (
                  <span className="text-sm text-gray-500">No email</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Email Template */}
      <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-4 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">📝 Email Template</h3>
        <pre className="text-sm text-gray-300 bg-gray-800 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
          {emailTemplate}
        </pre>
        <button
          onClick={() => {
            navigator.clipboard.writeText(emailTemplate);
            alert('Copied!');
          }}
          className="mt-3 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-sm font-medium"
        >
          Copy Template
        </button>
      </div>
    </div>
  );
}
