// Format number to exactly 2 decimal places
export function fmt(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return num.toFixed(2);
}
