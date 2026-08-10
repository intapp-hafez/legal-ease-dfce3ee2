import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

/** Appends an entry to the persisted audit log and notifies listeners. */
export async function logAudit(entry: {
  action: string;
  target: string;
  details?: string | undefined;
  user_id?: string | undefined;
}) {
  const { error } = await supabase.from("audit_logs").insert({
    action: entry.action,
    target: entry.target,
    details: entry.details,
    user_id: entry.user_id || undefined,
    ip_address: CURRENT_IP,
  });
  
  if (error) {
    console.error("Failed to log audit:", error);
  }
}

/** Reactive access to the audit log. */
export function useAuditLog() {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
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
        .limit(300);

      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        id: row.id,
        time: new Date(row.action_time).toLocaleString("ar-SA"),
        user: row.profiles?.full_name || "النظام",
        action: row.action,
        target: row.target,
        ip: row.ip_address,
        details: row.details,
      }));
    }
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audit_logs"] }),
  });

  const clear = useCallback(() => {
    clearMutation.mutate();
  }, [clearMutation]);

  return { entries, clear, isLoading };
}
