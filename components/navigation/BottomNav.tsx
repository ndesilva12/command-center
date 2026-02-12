"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Home, Sparkles, Mail, Grid3X3, Calendar } from "lucide-react";
import { ToolGridOverlay } from "@/components/mobile/ToolGridOverlay";

export function BottomNav() {
  const pathname = usePathname();
  const [showToolGrid, setShowToolGrid] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "calc(72px + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--glass-border)",
        zIndex: 1000,
        display: "none",
      }}
      className="mobile-bottom-nav"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          height: "100%",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <NavItem href="/" icon={Home} label="Home" active={isActive("/")} />
        <NavItem href="/tools/emails" icon={Mail} label="Email" active={isActive("/tools/emails")} />
        <NavItem href="/tools/calendar" icon={Calendar} label="Calendar" active={isActive("/tools/calendar")} />
        <NavItem href="/jimmy" icon={Sparkles} label="Jimmy" active={isActive("/jimmy")} />
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowToolGrid(true);
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            color: "var(--muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s",
            padding: "8px",
          }}
        >
          <Grid3X3
            style={{
              width: "24px",
              height: "24px",
              strokeWidth: 2,
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
            }}
          >
            Tools
          </span>
        </button>
      </div>

      <ToolGridOverlay isOpen={showToolGrid} onClose={() => setShowToolGrid(false)} />

      <style jsx>{`
        @media (max-width: 640px) {
          .mobile-bottom-nav {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}

function NavItem({
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        color: active ? "var(--accent)" : "var(--muted)",
        textDecoration: "none",
        transition: "all 0.2s",
        padding: "8px",
      }}
    >
      <Icon
        style={{
          width: "24px",
          height: "24px",
          strokeWidth: active ? 2.5 : 2,
        }}
      />
      <span
        style={{
          fontSize: "11px",
          fontWeight: active ? 600 : 500,
        }}
      >
        {label}
      </span>
    </Link>
  );
}
