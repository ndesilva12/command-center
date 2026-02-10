"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredPermission?: string;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermission,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, userData, loading, isAdmin, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Redirect to login if auth is required and user is not logged in
    if (requireAuth && !user) {
      router.push("/login");
      return;
    }

    // Redirect if admin only and user is not admin
    if (adminOnly && !isAdmin) {
      router.push("/");
      return;
    }

    // Redirect if specific permission is required and user doesn't have it
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push("/");
      return;
    }
  }, [user, userData, loading, isAdmin, hasPermission, requireAuth, adminOnly, requiredPermission, router]);

  // Show loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--background)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid var(--glass-border)",
              borderTop: "4px solid var(--foreground)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ fontSize: "14px", color: "var(--muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user doesn't have access
  if (requireAuth && !user) return null;
  if (adminOnly && !isAdmin) return null;
  if (requiredPermission && !hasPermission(requiredPermission)) return null;

  return <>{children}</>;
}
