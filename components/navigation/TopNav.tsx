"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Home, Search, Settings, Sparkles, LogOut, Shield } from "lucide-react";
import { UniversalSearch } from "@/components/search/UniversalSearch";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function TopNav() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [showUniversalSearch, setShowUniversalSearch] = useState(false);
  const { user, userData, isAdmin } = useAuth();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowUniversalSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "linear-gradient(180deg, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 40%, rgba(0, 0, 0, 0) 100%)",
          backdropFilter: "blur(12px)",
          borderBottom: "none",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            height: "100%",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left Side - Search Icon + Command Center Text */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setShowUniversalSearch(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                cursor: "pointer",
                transition: "all 0.2s",
                color: "var(--foreground-muted)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(0, 170, 255, 0.3)";
                e.currentTarget.style.color = "#00aaff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.color = "var(--foreground-muted)";
              }}
            >
              <Search style={{ width: "18px", height: "18px" }} />
            </button>
            <span style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--foreground)",
              letterSpacing: "0.02em",
              fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
            }}>
              Command Center
            </span>
          </div>

          {/* Main Nav - Hidden on mobile (uses BottomNav instead) */}
          {!isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <NavLink href="/" icon={Home} label="Home" active={isActive("/")} />
              <NavLink href="/jimmy" icon={Sparkles} label="Jimmy" active={isActive("/jimmy")} />
              <NavLink href="/settings" icon={Settings} label="Settings" active={isActive("/settings")} />
              
              {/* Logout Button - Icon Only */}
              {user && (
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    color: "var(--muted)",
                    background: "transparent",
                    border: "1px solid transparent",
                    textDecoration: "none",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <LogOut style={{ width: "18px", height: "18px" }} />
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Universal Search Modal */}
      <UniversalSearch
        isOpen={showUniversalSearch}
        onClose={() => setShowUniversalSearch(false)}
      />
    </>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "15px",
        fontWeight: 600,
        color: active ? "var(--foreground)" : "var(--muted)",
        background: active ? "var(--glass-bg)" : "transparent",
        border: active ? "1px solid var(--glass-border)" : "1px solid transparent",
        textDecoration: "none",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--foreground)";
          e.currentTarget.style.background = "var(--glass-bg)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--muted)";
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <Icon style={{ width: "18px", height: "18px" }} />
      <span>{label}</span>
    </Link>
  );
}
