"use client";

/**
 * ToolBackground - Renders a subtle gradient background tinted with the tool's color
 * Place this as the first child of the page, positioned fixed behind all content.
 */
export function ToolBackground({ color }: { color: string }) {
  // Convert hex to RGB for opacity control
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "99, 102, 241"; // fallback indigo
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  };

  const rgb = hexToRgb(color);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: `
          radial-gradient(ellipse at top left, rgba(${rgb}, 0.04) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(${rgb}, 0.03) 0%, transparent 50%),
          linear-gradient(180deg, rgba(${rgb}, 0.02) 0%, transparent 40%)
        `,
      }}
    />
  );
}
