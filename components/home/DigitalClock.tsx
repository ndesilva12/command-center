"use client";

import { useState, useEffect } from "react";

export function DigitalClock() {
  const [time, setTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{
      textAlign: "center",
    }}>
      <div style={{
        fontSize: isMobile ? "48px" : "64px",
        fontWeight: 700,
        fontFamily: "'Orbitron', monospace",
        color: "var(--foreground)",
        letterSpacing: "0.05em",
        marginBottom: isMobile ? "6px" : "8px",
        fontVariantNumeric: "tabular-nums"
      }}>
        {formatTime(time)}
      </div>
      <div style={{
        fontSize: isMobile ? "14px" : "16px",
        color: "var(--foreground-muted)",
        fontWeight: 400
      }}>
        {formatDate(time)}
      </div>
    </div>
  );
}
