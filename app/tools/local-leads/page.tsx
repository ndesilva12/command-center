'use client';

import { useState, useEffect, useCallback } from 'react';

interface Lead {
  id: string;
  source: 'x' | 'reddit' | 'facebook';
  type: string; // roofing, plumbing, legal, etc.
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
  'roofing', 'plumbing', 'hvac', 'electrical', 'landscaping', 'cleaning',
  'painting', 'contractor', 'legal', 'realtor', 'moving', 'auto'
];

export default function LocalLeadsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'businesses' | 'outreach' | 'settings'>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<Stats>({ leadsFound: 0, leadsSold: 0, totalRevenue: 0, activeBusinesses: 0, conversionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [discoveryRunning, setDiscoveryRunning] = useState(false);
  const [selectedTowns, setSelectedTowns] = useState<string[]>(TOWNS);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(LEAD_TYPES);

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
        body: JSON.stringify({ towns: selectedTowns, types: selectedTypes })
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

  const updateLeadStatus = async (leadId: string, status: Lead['status'], soldTo?: string, price?: number) => {
    try {
      await fetch('/api/local-leads/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status, soldTo, price })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update lead:', err);
    }
  };

  const addBusiness = async (business: Partial<Business>) => {
    try {
      await fetch('/api/local-leads/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(business)
      });
      fetchData();
    } catch (err) {
      console.error('Failed to add business:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading Local Leads...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🎯 Local Leads</h1>
              <p className="text-gray-400 text-sm">Lead generation for MA South Shore businesses</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">${stats.totalRevenue.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Total Revenue</div>
              </div>
              <button
                onClick={runDiscovery}
                disabled={discoveryRunning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-medium transition"
              >
                {discoveryRunning ? 'Discovering...' : '🔍 Run Discovery'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {(['dashboard', 'leads', 'businesses', 'outreach', 'settings'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t-lg font-medium transition capitalize ${
                  activeTab === tab
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab stats={stats} leads={leads} businesses={businesses} />
        )}
        {activeTab === 'leads' && (
          <LeadsTab leads={leads} businesses={businesses} onUpdateStatus={updateLeadStatus} />
        )}
        {activeTab === 'businesses' && (
          <BusinessesTab businesses={businesses} onAddBusiness={addBusiness} />
        )}
        {activeTab === 'outreach' && (
          <OutreachTab businesses={businesses} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            selectedTowns={selectedTowns}
            setSelectedTowns={setSelectedTowns}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
          />
        )}
      </div>
    </div>
  );
}

function DashboardTab({ stats, leads, businesses }: { stats: Stats; leads: Lead[]; businesses: Business[] }) {
  const recentLeads = leads.slice(0, 10);
  const newLeads = leads.filter(l => l.status === 'new').length;
  const activeBusinesses = businesses.filter(b => b.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard label="Leads Found" value={stats.leadsFound} color="blue" />
        <StatCard label="New Leads" value={newLeads} color="yellow" />
        <StatCard label="Leads Sold" value={stats.leadsSold} color="green" />
        <StatCard label="Active Buyers" value={activeBusinesses} color="purple" />
        <StatCard label="Revenue" value={`$${stats.totalRevenue.toFixed(0)}`} color="emerald" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">📥 Recent Leads</h3>
          {recentLeads.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No leads yet. Run discovery to find leads.
            </div>
          ) : (
            <div className="space-y-2">
              {recentLeads.map(lead => (
                <div key={lead.id} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{lead.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      lead.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                      lead.status === 'sold' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-600 text-gray-300'
                    }`}>{lead.status}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{lead.text}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{lead.town}</span>
                    <span>•</span>
                    <span>{lead.source}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Businesses */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">🏢 Active Buyers</h3>
          {businesses.filter(b => b.status === 'active').length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No active buyers yet. Start outreach to onboard businesses.
            </div>
          ) : (
            <div className="space-y-2">
              {businesses.filter(b => b.status === 'active').map(biz => (
                <div key={biz.id} className="p-3 bg-gray-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{biz.name}</div>
                    <div className="text-sm text-gray-400">{biz.type} • {biz.town}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-medium">${biz.pricePerLead}/lead</div>
                    <div className="text-xs text-gray-500">{biz.totalLeadsBought} bought</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">📊 Lead Pipeline</h3>
        <div className="grid grid-cols-5 gap-4">
          {['new', 'contacted', 'sold', 'delivered', 'expired'].map(status => {
            const count = leads.filter(l => l.status === status).length;
            return (
              <div key={status} className="text-center p-4 bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-400 capitalize">{status}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div className={`p-4 rounded-xl ${colorClasses[color] || 'bg-gray-800'}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function LeadsTab({ leads, businesses, onUpdateStatus }: {
  leads: Lead[];
  businesses: Business[];
  onUpdateStatus: (id: string, status: Lead['status'], soldTo?: string, price?: number) => void;
}) {
  const [filter, setFilter] = useState<'all' | Lead['status']>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredLeads = leads.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false;
    if (typeFilter !== 'all' && l.type !== typeFilter) return false;
    return true;
  });

  const activeBusinesses = businesses.filter(b => b.status === 'active');

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as typeof filter)}
          className="px-3 py-2 bg-gray-800 rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="sold">Sold</option>
          <option value="delivered">Delivered</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 rounded-lg text-sm"
        >
          <option value="all">All Types</option>
          {LEAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Leads Table */}
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Type</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Lead</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Town</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Source</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map(lead => (
              <tr key={lead.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                <td className="p-3">
                  <span className="px-2 py-1 bg-gray-700 rounded text-sm capitalize">{lead.type}</span>
                </td>
                <td className="p-3">
                  <div className="max-w-md">
                    <p className="text-sm line-clamp-2">{lead.text}</p>
                    <a href={lead.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                      View original →
                    </a>
                  </div>
                </td>
                <td className="p-3 text-sm">{lead.town}</td>
                <td className="p-3 text-sm text-gray-400">{lead.source}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    lead.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                    lead.status === 'sold' ? 'bg-green-500/20 text-green-400' :
                    lead.status === 'delivered' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-600 text-gray-300'
                  }`}>{lead.status}</span>
                </td>
                <td className="p-3">
                  {lead.status === 'new' && activeBusinesses.length > 0 && (
                    <select
                      onChange={e => {
                        const biz = activeBusinesses.find(b => b.id === e.target.value);
                        if (biz) onUpdateStatus(lead.id, 'sold', biz.name, biz.pricePerLead);
                      }}
                      className="px-2 py-1 bg-green-600 rounded text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>Sell to...</option>
                      {activeBusinesses.filter(b => b.type === lead.type).map(b => (
                        <option key={b.id} value={b.id}>{b.name} (${b.pricePerLead})</option>
                      ))}
                    </select>
                  )}
                  {lead.status === 'sold' && (
                    <button
                      onClick={() => onUpdateStatus(lead.id, 'delivered')}
                      className="px-2 py-1 bg-blue-600 rounded text-sm"
                    >
                      Mark Delivered
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeads.length === 0 && (
          <div className="text-center py-8 text-gray-500">No leads match filters</div>
        )}
      </div>
    </div>
  );
}

function BusinessesTab({ businesses, onAddBusiness }: {
  businesses: Business[];
  onAddBusiness: (b: Partial<Business>) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newBiz, setNewBiz] = useState<Partial<Business>>({
    name: '', type: 'roofing', town: 'Wellesley', email: '', status: 'prospect', pricePerLead: 25
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Business Database</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
        >
          + Add Business
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-900 p-4 rounded-xl space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <input
              placeholder="Business Name"
              value={newBiz.name}
              onChange={e => setNewBiz({ ...newBiz, name: e.target.value })}
              className="px-3 py-2 bg-gray-800 rounded-lg"
            />
            <select
              value={newBiz.type}
              onChange={e => setNewBiz({ ...newBiz, type: e.target.value })}
              className="px-3 py-2 bg-gray-800 rounded-lg"
            >
              {LEAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={newBiz.town}
              onChange={e => setNewBiz({ ...newBiz, town: e.target.value })}
              className="px-3 py-2 bg-gray-800 rounded-lg"
            >
              {TOWNS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              placeholder="Email"
              type="email"
              value={newBiz.email}
              onChange={e => setNewBiz({ ...newBiz, email: e.target.value })}
              className="px-3 py-2 bg-gray-800 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <input
              placeholder="Phone"
              value={newBiz.phone || ''}
              onChange={e => setNewBiz({ ...newBiz, phone: e.target.value })}
              className="px-3 py-2 bg-gray-800 rounded-lg"
            />
            <input
              placeholder="Website"
              value={newBiz.website || ''}
              onChange={e => setNewBiz({ ...newBiz, website: e.target.value })}
              className="px-3 py-2 bg-gray-800 rounded-lg"
            />
            <input
              placeholder="Price per lead"
              type="number"
              value={newBiz.pricePerLead || 25}
              onChange={e => setNewBiz({ ...newBiz, pricePerLead: Number(e.target.value) })}
              className="px-3 py-2 bg-gray-800 rounded-lg"
            />
            <button
              onClick={() => {
                onAddBusiness(newBiz);
                setShowAdd(false);
                setNewBiz({ name: '', type: 'roofing', town: 'Wellesley', email: '', status: 'prospect', pricePerLead: 25 });
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              Save Business
            </button>
          </div>
        </div>
      )}

      {/* Businesses Table */}
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Business</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Type</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Town</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Contact</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Price/Lead</th>
              <th className="text-left p-3 text-sm font-medium text-gray-400">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map(biz => (
              <tr key={biz.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                <td className="p-3 font-medium">{biz.name}</td>
                <td className="p-3 text-sm capitalize">{biz.type}</td>
                <td className="p-3 text-sm">{biz.town}</td>
                <td className="p-3 text-sm text-gray-400">{biz.email}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    biz.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    biz.status === 'negotiating' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-600 text-gray-300'
                  }`}>{biz.status}</span>
                </td>
                <td className="p-3 text-sm">${biz.pricePerLead || 0}</td>
                <td className="p-3 text-sm text-green-400">${biz.totalRevenue || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {businesses.length === 0 && (
          <div className="text-center py-8 text-gray-500">No businesses yet. Add your first prospect.</div>
        )}
      </div>
    </div>
  );
}

function OutreachTab({ businesses }: { businesses: Business[] }) {
  const prospects = businesses.filter(b => b.status === 'prospect' || b.status === 'contacted');

  const emailTemplate = `Subject: Qualified leads for your [TYPE] business in [TOWN]

Hi [NAME],

I run a local lead generation service covering [TOWN] and surrounding areas. I find people actively looking for [TYPE] services on social media and community forums.

Here's how it works:
- I send you qualified leads (name, contact, specific need)
- You only pay for leads you actually want
- $[PRICE] per lead, no contracts or minimums

I already have leads waiting. Want me to send a sample?

Best,
Jimmy
jimmytools.net`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Prospects to Contact */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">📤 Prospects to Contact</h3>
          {prospects.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Add businesses to start outreach
            </div>
          ) : (
            <div className="space-y-2">
              {prospects.map(biz => (
                <div key={biz.id} className="p-3 bg-gray-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{biz.name}</div>
                    <div className="text-sm text-gray-400">{biz.type} • {biz.town}</div>
                    <div className="text-xs text-gray-500">{biz.email}</div>
                  </div>
                  <a
                    href={`mailto:${biz.email}?subject=Qualified leads for your ${biz.type} business in ${biz.town}`}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    Send Email
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Template */}
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-lg font-semibold mb-4">📝 Email Template</h3>
          <textarea
            value={emailTemplate}
            readOnly
            className="w-full h-64 p-3 bg-gray-800 rounded-lg text-sm font-mono"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(emailTemplate);
              alert('Template copied!');
            }}
            className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
          >
            Copy Template
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({
  selectedTowns,
  setSelectedTowns,
  selectedTypes,
  setSelectedTypes
}: {
  selectedTowns: string[];
  setSelectedTowns: (t: string[]) => void;
  selectedTypes: string[];
  setSelectedTypes: (t: string[]) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Towns */}
      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">🗺️ Target Towns</h3>
        <div className="flex flex-wrap gap-2">
          {TOWNS.map(town => (
            <button
              key={town}
              onClick={() => {
                if (selectedTowns.includes(town)) {
                  setSelectedTowns(selectedTowns.filter(t => t !== town));
                } else {
                  setSelectedTowns([...selectedTowns, town]);
                }
              }}
              className={`px-3 py-1 rounded-full text-sm transition ${
                selectedTowns.includes(town)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {town}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Types */}
      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">🏷️ Lead Types</h3>
        <div className="flex flex-wrap gap-2">
          {LEAD_TYPES.map(type => (
            <button
              key={type}
              onClick={() => {
                if (selectedTypes.includes(type)) {
                  setSelectedTypes(selectedTypes.filter(t => t !== type));
                } else {
                  setSelectedTypes([...selectedTypes, type]);
                }
              }}
              className={`px-3 py-1 rounded-full text-sm transition capitalize ${
                selectedTypes.includes(type)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Sources */}
      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-4">📡 Discovery Sources</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium">𝕏 Twitter/X</div>
              <div className="text-sm text-gray-400">Local hashtags, complaints, recommendations</div>
            </div>
            <span className="text-green-400 text-sm">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium">🤖 Reddit</div>
              <div className="text-sm text-gray-400">r/massachusetts, r/boston, local subs</div>
            </div>
            <span className="text-green-400 text-sm">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium">📘 Facebook</div>
              <div className="text-sm text-gray-400">Local groups, marketplace</div>
            </div>
            <span className="text-yellow-400 text-sm">Pending Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
