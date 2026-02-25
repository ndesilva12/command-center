"use client";

import React from "react";
import { TrendingUp, Clock, Calendar } from "lucide-react";

export function ThePortal({ isMobile }: { isMobile: boolean }) {
  // Portal opens March 23, 2026
  const portalOpenDate = new Date("2026-03-23T00:00:00");
  const now = new Date();
  const daysUntil = Math.ceil((portalOpenDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isOpen = daysUntil <= 0;

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: "80px 20px",
      textAlign: "center",
    }}>
      <div style={{
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "rgba(59,130,246,0.1)",
        border: "2px solid rgba(59,130,246,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "24px",
      }}>
        <TrendingUp size={36} style={{ color: "#60a5fa" }} />
      </div>

      <h2 style={{ 
        fontSize: "24px", 
        fontWeight: 700, 
        color: "#f3f4f6", 
        marginBottom: "12px" 
      }}>
        The Portal
      </h2>

      {isOpen ? (
        <p style={{ fontSize: "16px", color: "#10b981", fontWeight: 600, marginBottom: "8px" }}>
          🟢 Portal is OPEN
        </p>
      ) : (
        <>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            borderRadius: "12px",
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.3)",
            marginBottom: "16px",
          }}>
            <Clock size={18} style={{ color: "#60a5fa" }} />
            <span style={{ fontSize: "20px", fontWeight: 700, color: "#60a5fa" }}>
              {daysUntil} days
            </span>
            <span style={{ fontSize: "14px", color: "#9ca3af" }}>until portal opens</span>
          </div>

          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            color: "#6b7280",
            fontSize: "14px",
          }}>
            <Calendar size={16} />
            <span>Opens <strong style={{ color: "#9ca3af" }}>March 23, 2026</strong></span>
          </div>
        </>
      )}

      <p style={{ 
        fontSize: "14px", 
        color: "#6b7280", 
        maxWidth: "400px", 
        marginTop: "24px",
        lineHeight: 1.6,
      }}>
        {isOpen 
          ? "Players entering the transfer portal will appear here. Use the Big Board to track your top targets."
          : "When the transfer portal opens, players entering will appear here for tracking and scouting."
        }
      </p>
    </div>
  );
}
