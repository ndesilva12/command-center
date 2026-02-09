"use client";

import { useState, useEffect } from "react";
import { Users, RefreshCw, Search, Plus, X, Edit2, Save, Trash2, ExternalLink } from "lucide-react";

interface Person {
  id: string;
  name: string;
  nickname?: string;
  phone?: string;
  email?: string;
  birthday?: string;
  relationship?: string;
  relationshipDetail?: string;
  location?: string;
  originalLocation?: string;
  profession?: string;
  almaMater?: string;
  affiliations?: string;
  interests?: string;
  favoriteBrands?: string;
  giftIdeas?: string;
  pastGifts?: string;
  sizes?: string;
  notes?: string;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedPerson, setEditedPerson] = useState<Partial<Person>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterRelationship, setFilterRelationship] = useState("all");

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/people');
      const data = await res.json();
      setPeople(data.people || []);
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/people?sync=true');
      const data = await res.json();
      if (data.synced) {
        setPeople(data.people || []);
        alert(`✅ Synced ${data.count} people from Notion!`);
      }
    } catch (err) {
      console.error('Sync error:', err);
      alert('❌ Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPerson) return;
    
    try {
      const res = await fetch(`/api/people/${selectedPerson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedPerson),
      });
      
      if (res.ok) {
        const data = await res.json();
        setPeople(prev => prev.map(p => p.id === data.person.id ? data.person : p));
        setSelectedPerson(data.person);
        setEditMode(false);
        alert('✅ Person updated!');
      } else {
        alert('❌ Failed to update');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('❌ Update failed');
    }
  };

  const handleDelete = async () => {
    if (!selectedPerson || !confirm(`Delete ${selectedPerson.name}?`)) return;
    
    try {
      const res = await fetch(`/api/people/${selectedPerson.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setPeople(prev => prev.filter(p => p.id !== selectedPerson.id));
        setSelectedPerson(null);
        alert('✅ Person deleted!');
      } else {
        alert('❌ Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('❌ Delete failed');
    }
  };

  const handleCreate = async () => {
    if (!editedPerson.name) {
      alert('Name is required');
      return;
    }
    
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedPerson),
      });
      
      if (res.ok) {
        const data = await res.json();
        setPeople(prev => [data.person, ...prev]);
        setShowAddModal(false);
        setEditedPerson({});
        alert('✅ Person created!');
      } else {
        alert('❌ Failed to create');
      }
    } catch (err) {
      console.error('Create error:', err);
      alert('❌ Create failed');
    }
  };

  const filteredPeople = people.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.relationship?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterRelationship === 'all' || p.relationship === filterRelationship;
    
    return matchesSearch && matchesFilter;
  });

  const relationships = Array.from(new Set(people.map(p => p.relationship).filter(Boolean)));

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--background)",
      padding: "80px 20px 20px",
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Users size={48} style={{ color: "var(--primary)" }} />
            <div>
              <h1 style={{ fontSize: "36px", fontWeight: "bold", color: "var(--foreground)", margin: 0 }}>
                People
              </h1>
              <p style={{ color: "var(--muted)", marginTop: "4px" }}>
                {people.length} contacts
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => window.open('https://www.notion.so/2fbbedd41419819deaf93da2dee6e098a', '_blank')}
              style={{
                padding: "10px 20px",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "8px",
                color: "var(--foreground)",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ExternalLink size={16} />
              Open in Notion
            </button>
            
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                padding: "10px 20px",
                background: syncing ? "var(--glass-bg)" : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                cursor: syncing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <RefreshCw size={16} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
              {syncing ? 'Syncing...' : 'Sync from Notion'}
            </button>
            
            <button
              onClick={() => {
                setShowAddModal(true);
                setEditedPerson({});
              }}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Plus size={16} />
              Add Person
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 44px",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "8px",
                color: "var(--foreground)",
                fontSize: "14px",
              }}
            />
          </div>
          
          <select
            value={filterRelationship}
            onChange={(e) => setFilterRelationship(e.target.value)}
            style={{
              padding: "10px 14px",
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "8px",
              color: "var(--foreground)",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            <option value="all">All Relationships</option>
            {relationships.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* People Grid */}
        {loading ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>Loading...</p>
        ) : filteredPeople.length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>
            No people found. {people.length === 0 ? 'Click "Sync from Notion" to load.' : 'Try adjusting your search.'}
          </p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}>
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                onClick={() => {
                  setSelectedPerson(person);
                  setEditedPerson(person);
                  setEditMode(false);
                }}
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "12px",
                  padding: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--glass-bg-hover)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--glass-bg)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {person.photoUrl && (
                  <img
                    src={person.photoUrl}
                    alt={person.name}
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginBottom: "12px",
                    }}
                  />
                )}
                
                <h3 style={{ fontSize: "18px", fontWeight: "600", color: "var(--foreground)", marginBottom: "4px" }}>
                  {person.name}
                </h3>
                
                {person.nickname && (
                  <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "8px" }}>
                    "{person.nickname}"
                  </p>
                )}
                
                {person.relationship && (
                  <span style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    background: "rgba(99, 102, 241, 0.1)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#818cf8",
                    marginBottom: "8px",
                  }}>
                    {person.relationship}
                  </span>
                )}
                
                {person.email && (
                  <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "8px" }}>
                    📧 {person.email}
                  </p>
                )}
                
                {person.phone && (
                  <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                    📱 {person.phone}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPerson && (
        <PersonDetailModal
          person={selectedPerson}
          editMode={editMode}
          editedPerson={editedPerson}
          onClose={() => {
            setSelectedPerson(null);
            setEditMode(false);
          }}
          onEdit={() => setEditMode(true)}
          onSave={handleSave}
          onDelete={handleDelete}
          onFieldChange={(field, value) => setEditedPerson(prev => ({ ...prev, [field]: value }))}
        />
      )}

      {/* Add Person Modal */}
      {showAddModal && (
        <PersonDetailModal
          person={editedPerson as Person}
          editMode={true}
          editedPerson={editedPerson}
          isNew={true}
          onClose={() => {
            setShowAddModal(false);
            setEditedPerson({});
          }}
          onSave={handleCreate}
          onFieldChange={(field, value) => setEditedPerson(prev => ({ ...prev, [field]: value }))}
        />
      )}
    </div>
  );
}

// Person Detail Modal Component
function PersonDetailModal({
  person,
  editMode,
  editedPerson,
  isNew = false,
  onClose,
  onEdit,
  onSave,
  onDelete,
  onFieldChange,
}: {
  person: Person;
  editMode: boolean;
  editedPerson: Partial<Person>;
  isNew?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onFieldChange: (field: string, value: string) => void;
}) {
  const fields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'nickname', label: 'Nickname' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'birthday', label: 'Birthday' },
    { key: 'relationship', label: 'Relationship' },
    { key: 'relationshipDetail', label: 'Relationship Detail' },
    { key: 'location', label: 'Location' },
    { key: 'originalLocation', label: 'Original Location' },
    { key: 'profession', label: 'Profession' },
    { key: 'almaMater', label: 'Alma Mater' },
    { key: 'affiliations', label: 'Affiliations' },
    { key: 'interests', label: 'Interests', multiline: true },
    { key: 'favoriteBrands', label: 'Favorite Brands' },
    { key: 'giftIdeas', label: 'Gift Ideas', multiline: true },
    { key: 'pastGifts', label: 'Past Gifts', multiline: true },
    { key: 'sizes', label: 'Sizes' },
    { key: 'notes', label: 'Notes', multiline: true },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--background)",
          border: "1px solid var(--glass-border)",
          borderRadius: "16px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          padding: "32px",
        }}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--foreground)", margin: 0 }}>
            {isNew ? 'New Person' : editMode ? 'Edit Person' : person.name}
          </h2>
          
          <div style={{ display: "flex", gap: "8px" }}>
            {!isNew && !editMode && onEdit && (
              <button onClick={onEdit} style={{ padding: "8px", background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "8px", cursor: "pointer" }}>
                <Edit2 size={16} style={{ color: "var(--foreground)" }} />
              </button>
            )}
            
            {editMode && (
              <button onClick={onSave} style={{ padding: "8px", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                <Save size={16} style={{ color: "white" }} />
              </button>
            )}
            
            {!isNew && onDelete && (
              <button onClick={onDelete} style={{ padding: "8px", background: "var(--glass-bg)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", cursor: "pointer" }}>
                <Trash2 size={16} style={{ color: "#ef4444" }} />
              </button>
            )}
            
            <button onClick={onClose} style={{ padding: "8px", background: "var(--glass-bg)", border: "1px solid var(--glass-border)", borderRadius: "8px", cursor: "pointer" }}>
              <X size={16} style={{ color: "var(--foreground)" }} />
            </button>
          </div>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {fields.map(field => {
            const value = editMode ? (editedPerson[field.key as keyof Person] || '') : (person[field.key as keyof Person] || '');
            
            return (
              <div key={field.key}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--muted)", marginBottom: "6px" }}>
                  {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
                
                {editMode ? (
                  field.multiline ? (
                    <textarea
                      value={value as string}
                      onChange={(e) => onFieldChange(field.key, e.target.value)}
                      rows={3}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "var(--glass-bg)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={value as string}
                      onChange={(e) => onFieldChange(field.key, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "var(--glass-bg)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                        fontSize: "14px",
                      }}
                    />
                  )
                ) : (
                  <p style={{ fontSize: "14px", color: "var(--foreground)", margin: 0, whiteSpace: "pre-wrap" }}>
                    {value || <span style={{ color: "var(--muted)" }}>—</span>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
