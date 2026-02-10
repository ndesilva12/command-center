"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Users, Plus, Trash2, Save, X } from "lucide-react";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "user";
  permissions: string[];
  createdAt: number;
  lastLogin: number;
}

// All available tools
const ALL_TOOLS = [
  { id: "emails", name: "Emails" },
  { id: "calendar", name: "Calendar" },
  { id: "contacts", name: "Contacts" },
  { id: "people", name: "People" },
  { id: "recommendations", name: "Recommendations" },
  { id: "news", name: "News" },
  { id: "rss", name: "RSS" },
  { id: "bookmarks", name: "Bookmarks" },
  { id: "market", name: "Market" },
  { id: "notes", name: "Notes" },
  { id: "files", name: "Files" },
  { id: "spotify", name: "Spotify" },
  { id: "trending", name: "Trending" },
  { id: "rosters", name: "Rosters" },
  { id: "meals", name: "Meal Plan" },
  { id: "curate", name: "Curate" },
  { id: "l3d", name: "L3D" },
  { id: "deep-search", name: "Deep Search" },
  { id: "dark-search", name: "Dark Search" },
  { id: "image-lookup", name: "Image Lookup" },
  { id: "contact-finder", name: "Contact Finder" },
  { id: "relationships", name: "Relationships" },
  { id: "mission", name: "Mission" },
  { id: "investors", name: "Investors" },
  { id: "business-info", name: "Business Info" },
  { id: "corporate", name: "Corporate" },
];

export default function AdminPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  
  // New user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  
  // Edit permissions
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && (!userData || userData.role !== "admin")) {
      router.push("/");
    }
  }, [userData, authLoading, router]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      
      // Create Firestore user document
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: newEmail,
        displayName: newDisplayName,
        role: newRole,
        permissions: newPermissions,
        createdAt: Date.now(),
        lastLogin: Date.now(),
      });

      // Reset form
      setNewEmail("");
      setNewPassword("");
      setNewDisplayName("");
      setNewRole("user");
      setNewPermissions([]);
      setShowCreateForm(false);
      
      // Reload users
      loadUsers();
    } catch (error: any) {
      alert("Failed to create user: " + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await deleteDoc(doc(db, "users", userId));
      loadUsers();
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  const handleSavePermissions = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        permissions: editPermissions,
      });
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      alert("Failed to update permissions");
    }
  };

  const startEditingPermissions = (user: User) => {
    setEditingUser(user.id);
    setEditPermissions(user.permissions);
  };

  if (authLoading || loading) {
    return <div style={{ padding: "80px 24px", textAlign: "center" }}>Loading...</div>;
  }

  if (!userData || userData.role !== "admin") {
    return null;
  }

  return (
    <>
      <TopNav />
      <BottomNav />
      <main style={{ minHeight: "100vh", paddingTop: "80px", paddingBottom: "32px", padding: "80px 24px 32px 24px" }}>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
            <div>
              <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
                User Management
              </h1>
              <p style={{ fontSize: "16px", color: "var(--muted)" }}>
                Manage users and permissions
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                background: "var(--foreground)",
                color: "var(--background)",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus style={{ width: "18px", height: "18px" }} />
              Create User
            </button>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <div style={{
              background: "var(--card-bg)",
              border: "1px solid var(--glass-border)",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px" }}>Create New User</h2>
              <form onSubmit={handleCreateUser} style={{ display: "grid", gap: "16px" }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  style={{
                    padding: "12px",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    color: "var(--foreground)",
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    padding: "12px",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    color: "var(--foreground)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  required
                  style={{
                    padding: "12px",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    color: "var(--foreground)",
                  }}
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
                  style={{
                    padding: "12px",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "8px",
                    fontSize: "15px",
                    color: "var(--foreground)",
                  }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "block" }}>
                    Permissions
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                    {ALL_TOOLS.map((tool) => (
                      <label key={tool.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={newPermissions.includes(tool.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPermissions([...newPermissions, tool.id]);
                            } else {
                              setNewPermissions(newPermissions.filter((id) => id !== tool.id));
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "14px" }}>{tool.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "var(--foreground)",
                      color: "var(--background)",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Create User
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    style={{
                      padding: "12px 24px",
                      background: "var(--glass-bg)",
                      color: "var(--foreground)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "8px",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users List */}
          <div style={{ display: "grid", gap: "16px" }}>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "12px",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
                      {user.displayName}
                    </h3>
                    <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "4px" }}>
                      {user.email}
                    </p>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        background: user.role === "admin" ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)",
                        color: user.role === "admin" ? "#ef4444" : "#3b82f6",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {editingUser === user.id ? (
                      <>
                        <button
                          onClick={() => handleSavePermissions(user.id)}
                          style={{
                            padding: "8px 16px",
                            background: "var(--foreground)",
                            color: "var(--background)",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Save style={{ width: "16px", height: "16px" }} />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          style={{
                            padding: "8px 16px",
                            background: "var(--glass-bg)",
                            color: "var(--foreground)",
                            border: "1px solid var(--glass-border)",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <X style={{ width: "16px", height: "16px" }} />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditingPermissions(user)}
                          style={{
                            padding: "8px 16px",
                            background: "var(--glass-bg)",
                            color: "var(--foreground)",
                            border: "1px solid var(--glass-border)",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Edit Permissions
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: "8px 16px",
                            background: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <Trash2 style={{ width: "16px", height: "16px" }} />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "block" }}>
                    {user.role === "admin" ? "Admin - Full Access" : "Tool Permissions"}
                  </label>
                  {user.role !== "admin" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                      {ALL_TOOLS.map((tool) => (
                        <label key={tool.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: editingUser === user.id ? "pointer" : "default" }}>
                          <input
                            type="checkbox"
                            checked={editingUser === user.id ? editPermissions.includes(tool.id) : user.permissions.includes(tool.id)}
                            onChange={(e) => {
                              if (editingUser === user.id) {
                                if (e.target.checked) {
                                  setEditPermissions([...editPermissions, tool.id]);
                                } else {
                                  setEditPermissions(editPermissions.filter((id) => id !== tool.id));
                                }
                              }
                            }}
                            disabled={editingUser !== user.id}
                            style={{ cursor: editingUser === user.id ? "pointer" : "not-allowed" }}
                          />
                          <span style={{ fontSize: "14px", color: editingUser === user.id ? "var(--foreground)" : "var(--muted)" }}>
                            {tool.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
