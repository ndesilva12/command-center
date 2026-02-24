"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MealsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/tools/meal-plan");
  }, [router]);
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p style={{ color: "var(--foreground-muted)" }}>Redirecting to Meal Plan...</p>
    </div>
  );
}
