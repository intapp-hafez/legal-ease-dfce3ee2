import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useMemo } from "react";
import { useCollection, type Row } from "./crud";

export function useSupabaseCollection<T extends Row>(tableName: string, idKey: keyof T = "id" as keyof T) {
  const queryClient = useQueryClient();
  const localDb = useCollection<T>(`supabase_backup_${tableName}`, [], idKey);

  // 1. Fetch data
  const { data: dbItems = [], isLoading } = useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
        if (error) {
          console.warn(`Fetch error for ${tableName}:`, error.message);
          return null;
        }
        return (data || []) as T[];
      } catch (err) {
        console.warn(`Fetch exception for ${tableName}:`, err);
        return null;
      }
    },
  });

  // Helper to clean payload
  const cleanPayload = (row: Partial<T>) => {
    const payload = { ...row } as any;
    if (idKey !== "id") delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    
    // Convert empty strings to null to avoid type errors (e.g. uuid, date)
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") {
        payload[key] = null;
      }
    });
    return payload;
  };

  // Merge items from DB and local backup
  const items = useMemo(() => {
    if (dbItems && Array.isArray(dbItems) && dbItems.length > 0) {
      const dbIds = new Set(dbItems.map((it) => String(it[idKey])));
      const extraLocal = localDb.items.filter((it) => !dbIds.has(String(it[idKey])));
      return [...extraLocal, ...dbItems];
    }
    return localDb.items.length > 0 ? localDb.items : (dbItems || []);
  }, [dbItems, localDb.items, idKey]);

  // 2. Create data
  const createMutation = useMutation({
    mutationFn: async (row: T) => {
      const payload = cleanPayload(row);
      try {
        const { data, error } = await supabase.from(tableName).insert([payload]).select().single();
        if (error) {
          console.warn(`Supabase insert error in ${tableName}, saving locally:`, error.message);
          localDb.create(row);
          return row;
        }
        return data as T;
      } catch (err) {
        console.warn(`Insert exception in ${tableName}, saving locally:`, err);
        localDb.create(row);
        return row;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  // 3. Update data
  const updateMutation = useMutation({
    mutationFn: async ({ id, row }: { id: string | number; row: Partial<T> }) => {
      const payload = cleanPayload(row);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .update(payload)
          .eq(String(idKey), id)
          .select()
          .single();
          
        if (error) {
          console.warn(`Update error in ${tableName}, saving locally:`, error.message);
          localDb.update(id, row as T);
          return row as T;
        }
        return data as T;
      } catch (err) {
        console.warn(`Update exception in ${tableName}, saving locally:`, err);
        localDb.update(id, row as T);
        return row as T;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  // 4. Delete data
  const removeMutation = useMutation({
    mutationFn: async (id: string | number) => {
      localDb.remove(id);
      try {
        await supabase.from(tableName).delete().eq(String(idKey), id);
      } catch (err) {
        console.warn(`Delete error in ${tableName}:`, err);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  // 5. Bulk Replace (Used for imports)
  const replaceAllMutation = useMutation({
    mutationFn: async (rows: T[]) => {
      localDb.replaceAll(rows);
      try {
        const { data, error } = await supabase.from(tableName).upsert(rows as any).select();
        if (error) throw error;
        return data as T[];
      } catch {
        return rows;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [tableName] }),
  });

  return {
    items,
    hydrated: !isLoading || localDb.hydrated,
    create: createMutation.mutate,
    update: (id: string | number, row: T) => updateMutation.mutate({ id, row }),
    remove: removeMutation.mutate,
    replaceAll: replaceAllMutation.mutate,
    reset: localDb.reset,
  };
}

export function useProfilesOptions() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["hr-profiles-options"],
    queryFn: async () => {
      try {
        const { hrSupabase } = await import("./hr-supabase");
        const res = await hrSupabase
          .from("profiles")
          .select("id, full_name, emp_code, departments!profiles_department_id_fkey(name_ar)")
          .order("full_name");

        if (res.data && res.data.length > 0) {
          return res.data.map((p: any) => {
            const dept = p.departments?.name_ar ? ` (${p.departments.name_ar})` : "";
            const code = p.emp_code ? ` [${p.emp_code}]` : "";
            return {
              value: String(p.id),
              label: `${p.full_name || "بدون اسم"}${code}${dept}`
            };
          });
        }
      } catch (err) {
        console.warn("Failed to fetch from hrSupabase, falling back to local:", err);
      }

      const { data, error } = await supabase.from("profiles").select("id, full_name").order("full_name");
      if (error) throw error;
      return (data || []).map((p: any) => ({ value: String(p.id), label: String(p.full_name) }));
    }
  });
  return profiles;
}