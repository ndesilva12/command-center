"use client";

import { useEffect } from "react";

/**
 * ToolBackground - Sets the page background to a gradient using the tool's color.
 * Applies directly to document.body to guarantee visibility.
 */
export function ToolBackground({ color }: { color: string }) {
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "99, 102, 241";
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  };

  useEffect(() => {
    const rgb = hexToRgb(color);
    const gradient = `linear-gradient(135deg, rgba(${rgb}, 0.25) 0%, rgba(${rgb}, 0.08) 40%, #0a0a0e 80%)`;
    document.body.style.background = gradient;
    // Set CSS variables for tool-wide accent color
    document.documentElement.style.setProperty('--tool-color', color);
    document.documentElement.style.setProperty('--tool-color-rgb', rgb);
    
    return () => {
      document.body.style.background = "transparent";
      document.documentElement.style.removeProperty('--tool-color');
      document.documentElement.style.removeProperty('--tool-color-rgb');
    };
  }, [color]);

  return null;
}
