"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Mail } from "lucide-react";

interface GoogleAccount {
  email: string;
  name?: string;
  picture?: string;
}

export function ConnectedAccounts() {
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/auth/google/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleRemoveAccount = async (email: string) => {
    if (!confirm(`Remove ${email}?`)) return;

    try {
      const res = await fetch(`/api/auth/google/accounts?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadAccounts();
      } else {
        alert('Failed to remove account');
      }
    } catch (error) {
      console.error('Failed to remove account:', error);
      alert('Failed to remove account');
    }
  };

  const handleAddAccount = async () => {
    try {
      const res = await fetch('/api/auth/google?returnUrl=/settings');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to initiate Google auth:", err);
      alert("Failed to connect to Google");
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "24px" }}>
        <p style={{ color: "var(--muted)" }}>Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "24px" }}>
      <h2 style={{
        fontSize: "20px",
        fontWeight: 600,
        marginBottom: "16px",
        color: "var(--foreground)"
      }}>
        Connected Google Accounts
      </h2>

      {accounts.length === 0 ? (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: "var(--muted)", marginBottom: "16px" }}>
            No Google accounts connected
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          {accounts.map((account) => (
            <div
              key={account.email}
              className="card"
              style={{
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(255, 255, 255, 0.05)",
              }}
            >
              {account.picture ? (
                <img
                  src={account.picture}
                  alt={account.name || account.email}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4285f4, #34a853)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Mail style={{ width: "20px", height: "20px", color: "white" }} />
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "var(--foreground)" }}>
                  {account.name || account.email}
                </div>
                {account.name && (
                  <div style={{ fontSize: "14px", color: "var(--muted)" }}>
                    {account.email}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleRemoveAccount(account.email)}
                style={{
                  padding: "8px",
                  background: "rgba(220, 38, 38, 0.1)",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                  borderRadius: "8px",
                  color: "#dc2626",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(220, 38, 38, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)";
                }}
              >
                <Trash2 style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleAddAccount}
        style={{
          width: "100%",
          padding: "12px 24px",
          background: "linear-gradient(135deg, #4285f4, #34a853)",
          border: "none",
          borderRadius: "12px",
          color: "white",
          fontSize: "16px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(66, 133, 244, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <Plus style={{ width: "20px", height: "20px" }} />
        Add Another Google Account
      </button>
    </div>
  );
}
