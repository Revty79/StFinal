export function previewText(value: unknown, fallback = "Not set"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function previewCsv(value: unknown, fallback = "None"): string {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0);
  return items.length > 0 ? items.join(", ") : fallback;
}

export function previewRows(
  value: unknown,
  columns: string[],
  fallback = "No entries"
): string[] {
  if (!Array.isArray(value)) return [fallback];
  const rows = value
    .map((row) => {
      if (!row || typeof row !== "object") return "";
      const obj = row as Record<string, unknown>;
      return columns
        .map((col) => previewText(obj[col], ""))
        .filter((cell) => cell.length > 0)
        .join(" - ");
    })
    .filter((line) => line.length > 0);

  return rows.length > 0 ? rows : [fallback];
}

export function previewFirstRows(
  value: unknown,
  columns: string[],
  maxRows = 3,
  fallback = "No entries"
): string[] {
  return previewRows(value, columns, fallback).slice(0, maxRows);
}
