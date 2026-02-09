"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Mail, Calendar, Users, Settings } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

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
        height: "72px",
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
        <NavItem href="/tools/people" icon={Users} label="People" active={isActive("/tools/people")} />
        <NavItem href="/settings" icon={Settings} label="Settings" active={isActive("/settings")} />
      </div>

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
