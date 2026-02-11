"use client";

import { ReactNode, useEffect, useState } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";

interface MobileToolWrapperProps {
  children: ReactNode;
  maxWidth?: string;
}

export function MobileToolWrapper({ children, maxWidth = "1200px" }: MobileToolWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <TopNav />
      <BottomNav />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: isMobile ? "72px" : "80px",
          paddingBottom: isMobile ? "88px" : "32px",
          paddingLeft: isMobile ? "12px" : "24px",
          paddingRight: isMobile ? "12px" : "24px",
        }}
      >
        <div
          style={{
            maxWidth: isMobile ? "100%" : maxWidth,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {children}
        </div>
      </main>
    </>
  );
}
