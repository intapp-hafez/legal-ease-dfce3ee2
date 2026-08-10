import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Row } from "./crud";

export function useSupabaseCollection<T extends Row>(tableName: string, idKey: keyof T = "id" as keyof T) {
  const queryClient = useQueryClient();

  // 1. Fetch data
  const { data: items = [], isLoading } = useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw error;
      }
      return (data || []) as T[];
    },
  });

  // 2. Create data
  const createMutation = useMutation({
    mutationFn: async (row: T) => {
      const { data, error } = await supabase.from(tableName).insert([row as any]).select().single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  // 3. Update data
  const updateMutation = useMutation({
    mutationFn: async ({ id, row }: { id: string | number; row: Partial<T> }) => {
      const payload = { ...row } as any;
      
      // Remove read-only or strictly managed fields to prevent Supabase update errors
      if (idKey !== "id") delete payload.id; // Only delete id if it's not used as the primary lookup key
      delete payload.created_at;
      delete payload.updated_at;

      const { data, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq(String(idKey), id)
        .select()
        .single();
        
      if (error) {
        console.error(`Update Error in ${tableName}:`, error);
        alert(`فشل التحديث: ${error.message || "تأكد من الصلاحيات"}`);
        throw error;
      }
      return data as T;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  // 4. Delete data
  const removeMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const { error } = await supabase.from(tableName).delete().eq(String(idKey), id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  // 5. Bulk Replace (Used for imports)
  const replaceAllMutation = useMutation({
    mutationFn: async (rows: T[]) => {
      // Typically, for a true replace, we'd delete all and insert, but this might violate FKs.
      // We will just try to upsert based on the primary key.
      const { data, error } = await supabase.from(tableName).upsert(rows as any).select();
      if (error) throw error;
      return data as T[];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  return {
    items,
    hydrated: !isLoading,
    create: createMutation.mutate,
    update: (id: string | number, row: T) => updateMutation.mutate({ id, row }),
    remove: removeMutation.mutate,
    replaceAll: replaceAllMutation.mutate,
    reset: () => {}, // Not supported for DB
  };
}

export function useProfilesOptions() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (error) throw error;
      return data.map((p: any) => ({ value: String(p.id), label: String(p.full_name) }));
    }
  });
  return profiles;
}