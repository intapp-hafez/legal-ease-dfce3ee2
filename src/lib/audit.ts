import { useCallback, useEffect, useState } from "react";
import { auditLog as seedAudit } from "@/lib/legal-data";

export type AuditEntry = {
  time: string;
  user: string;
  action: string;
  target: string;
  ip: string;
  details?: string;
};

const KEY = "int-legal:audit";

/** Current signed-in user (frontend prototype — no auth backend). */
export const CURRENT_USER = "أ. حافظ رحيم";
const CURRENT_IP = "10.0.4.18";

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function read(): AuditEntry[] {
  if (typeof window === "undefined") return seedAudit as AuditEntry[];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seedAudit as AuditEntry[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuditEntry[]) : (seedAudit as AuditEntry[]);
  } catch {
    return seedAudit as AuditEntry[];
  }
}

/** Appends an entry to the persisted audit log and notifies listeners. */
export function logAudit(entry: {
  action: string;
  target: string;
  details?: string;
  user?: string;
}) {
  const next: AuditEntry[] = [
    {
      time: stamp(),
      user: entry.user ?? CURRENT_USER,
      action: entry.action,
      target: entry.target,
      ip: CURRENT_IP,
      ...(entry.details ? { details: entry.details } : {}),
    },
    ...read(),
  ].slice(0, 300);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("int-legal:audit-changed"));
  } catch {
    /* storage unavailable */
  }
}

/** Reactive access to the audit log. */
export function useAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>(seedAudit as AuditEntry[]);

  const refresh = useCallback(() => setEntries(read()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("int-legal:audit-changed", refresh);
    return () => window.removeEventListener("int-legal:audit-changed", refresh);
  }, [refresh]);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    setEntries(seedAudit as AuditEntry[]);
  }, []);

  return { entries, clear };
}
