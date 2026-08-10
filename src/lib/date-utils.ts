/**
 * Formats any date string or Date object into DD/MM/YYYY format.
 * Examples:
 *   "2026-02-01" -> "01/02/2026"
 *   "2026-02-01T14:30:00Z" -> "01/02/2026"
 *   "2026-9-5" -> "05/09/2026"
 */
export function formatDate(val: string | number | Date | null | undefined): string {
  if (val === null || val === undefined) return "—";
  const s = String(val).trim();
  if (!s || s === "null" || s === "undefined" || s === "—" || s === "-") return "—";

  // If already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  // Handle ISO format YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoMatch = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const [, y, m, d] = isoMatch;
    return `${(d || "").padStart(2, "0")}/${(m || "").padStart(2, "0")}/${y}`;
  }

  // Handle DD-MM-YYYY or D/M/YYYY
  const dmyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch && dmyMatch[1] && dmyMatch[2] && dmyMatch[3]) {
    const [, d, m, y] = dmyMatch;
    return `${(d || "").padStart(2, "0")}/${(m || "").padStart(2, "0")}/${y}`;
  }

  // Fallback to Date object parsing
  const date = new Date(s);
  if (!isNaN(date.getTime())) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return s;
}

/**
 * Formats date and time into DD/MM/YYYY HH:mm
 */
export function formatDateTime(val: string | number | Date | null | undefined): string {
  if (!val) return "—";
  const date = new Date(val);
  if (isNaN(date.getTime())) return formatDate(val);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${hours}:${mins}`;
}
