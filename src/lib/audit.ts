import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/date-utils";

export type AuditEntry = {
  id?: string;
  time: string;
  user: string;
  action: string;
  target: string;
  ip: string;
  details?: string;
};

/** Current signed-in IP (prototype) */
const CURRENT_IP = "10.0.4.18";
const AUDIT_STORAGE_KEY = "int-legal:audit-logs";

const defaultAuditEntries: AuditEntry[] = [
  {
    id: "aud-01",
    time: formatDateTime(new Date(Date.now() - 12 * 60 * 1000).toISOString()),
    user: "أ. حافظ رحيم (Super Admin)",
    action: "تحديث مصفوفة الصلاحيات وقواعد الإشعارات",
    target: "الإعدادات والصلاحيات",
    ip: "10.0.4.18",
    details: "تفعيل الرقابة التلقائية على عقود وهويات الموظفين",
  },
  {
    id: "aud-02",
    time: formatDateTime(new Date(Date.now() - 45 * 60 * 1000).toISOString()),
    user: "م. سارة يوسف (Admin)",
    action: "اعتماد وتوثيق عقد موظف",
    target: "العقد CT-2289 (سارة يوسف)",
    ip: "10.0.4.22",
    details: "تجديد سنوي معتمد",
  },
  {
    id: "aud-03",
    time: formatDateTime(new Date(Date.now() - 3 * 3600 * 1000).toISOString()),
    user: "أ. حافظ رحيم (Super Admin)",
    action: "رفع نسخة محدثة من السجل التجاري",
    target: "DOC-1001 (وزارة التجارة)",
    ip: "10.0.4.18",
    details: "تحديث ساري المفعول حتى 2027",
  },
  {
    id: "aud-04",
    time: formatDateTime(new Date(Date.now() - 6 * 3600 * 1000).toISOString()),
    user: "إدارة الموارد البشرية",
    action: "تسجيل عهدة جديدة لموظف",
    target: "AST-3301 (Dell Latitude 5540)",
    ip: "10.0.4.30",
    details: "إسناد للمهندس أحمد سالم",
  },
  {
    id: "aud-05",
    time: formatDateTime(new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
    user: "النظام التلقائي",
    action: "فحص دوري وإرسال تنبيهات الانتهاء",
    target: "عقود ومستندات الشركة",
    ip: "127.0.0.1",
    details: "تم فحص وتدقيق كافة التواريخ وتوليد الإشعارات",
  },
];

/** Appends an entry to the persisted audit log and notifies listeners. */
export async function logAudit(entry: {
  action: string;
  target: string;
  details?: string | undefined;
  user_id?: string | undefined;
}) {
  let userName = "النظام";
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem("int-legal:auth-user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        if (u?.name) userName = u.name;
      } catch {}
    }
  }

  const localItem: AuditEntry = {
    id: `aud-${Date.now()}`,
    time: formatDateTime(new Date().toISOString()),
    user: userName,
    action: entry.action,
    target: entry.target,
    ip: CURRENT_IP,
    details: entry.details || "",
  };

  // 1. Save to localStorage
  if (typeof window !== "undefined") {
    try {
      const existing = window.localStorage.getItem(AUDIT_STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : defaultAuditEntries;
      const next = [localItem, ...parsed].slice(0, 100);
      window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  // 2. Save to Supabase
  const payload = {
    user_id: entry.user_id || null,
    action: entry.action,
    target: entry.target,
    details: entry.details || "",
    ip_address: CURRENT_IP,
  };

  try {
    const { error } = await supabase.from("audit_logs").insert([payload]);
    if (error) console.warn("Audit log insert warning:", error.message);
  } catch (err) {
    console.warn("Audit log insert exception:", err);
  }
}

/** Hook to read and clear persisted audit entries from Supabase + localStorage. */
export function useAudit() {
  const queryClient = useQueryClient();

  const { data: entries = defaultAuditEntries, isLoading } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      let result: AuditEntry[] = [];

      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select(`
            id,
            action_time,
            action,
            target,
            details,
            ip_address,
            profiles(full_name)
          `)
          .order("action_time", { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          result = data.map((row: any) => ({
            id: row.id,
            time: formatDateTime(row.action_time),
            user: row.profiles?.full_name || "النظام",
            action: row.action,
            target: row.target,
            ip: row.ip_address,
            details: row.details,
          }));
        }
      } catch (e) {
        console.warn("Could not query audit_logs from Supabase:", e);
      }

      if (result.length === 0 && typeof window !== "undefined") {
        const local = window.localStorage.getItem(AUDIT_STORAGE_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed as AuditEntry[];
          } catch {}
        }
        return defaultAuditEntries;
      }

      return result.length > 0 ? result : defaultAuditEntries;
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([]));
      }
      try {
        await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      } catch {}
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audit_logs"] }),
  });

  const clear = useCallback(() => {
    clearMutation.mutate();
  }, [clearMutation]);

  return { entries, clear, isLoading };
}

export const useAuditLog = useAudit;
