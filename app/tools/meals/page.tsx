"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MealsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/tools/meal-plan");
  }, [router]);
  
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--foreground-muted)" }}>Redirecting to Meal Plan...</p>
    </div>
  );
}
