"use client";

import { useState, useEffect } from "react";

export function DigitalClock() {
  const [time, setTime] = useState(new Date());

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
      marginBottom: "40px"
    }}>
      <div style={{
        fontSize: "64px",
        fontWeight: 300,
        color: "var(--foreground)",
        letterSpacing: "0.05em",
        marginBottom: "8px",
        fontVariantNumeric: "tabular-nums"
      }}>
        {formatTime(time)}
      </div>
      <div style={{
        fontSize: "16px",
        color: "var(--foreground-muted)",
        fontWeight: 400
      }}>
        {formatDate(time)}
      </div>
    </div>
  );
}
