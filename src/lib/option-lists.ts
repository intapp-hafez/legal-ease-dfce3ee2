import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function normalizeOptionValue(s: string) {
  return s
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/[أإآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type OptionListApi = {
  options: string[];
  /** returns an error message, or null on success */
  add: (value: string) => string | null;
  rename: (oldValue: string, next: string) => string | null;
  remove: (value: string) => void;
  reset: () => void;
};

export function useOptionList(key: string, base: string[]): OptionListApi {
  const queryClient = useQueryClient();
  const dbKey = `option-list:${key}`;

  const { data: options = base } = useQuery({
    queryKey: ["settings", dbKey],
    queryFn: async () => {
      // 1. Try Supabase
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("value")
          .eq("key", dbKey)
          .maybeSingle();

        if (!error && data?.value && Array.isArray(data.value)) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(dbKey, JSON.stringify(data.value));
          }
          return data.value as string[];
        }
      } catch (e) {
        console.warn("Supabase fetch error for settings:", e);
      }

      // 2. Fallback to localStorage
      if (typeof window !== "undefined") {
        const local = window.localStorage.getItem(dbKey);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) return parsed as string[];
          } catch {}
        }
      }

      return base;
    },
    initialData: () => {
      if (typeof window !== "undefined") {
        const local = window.localStorage.getItem(dbKey);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) return parsed as string[];
          } catch {}
        }
      }
      return base;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newList: string[]) => {
      // 1. Save to localStorage immediately
      if (typeof window !== "undefined") {
        window.localStorage.setItem(dbKey, JSON.stringify(newList));
      }

      // 2. Try Supabase sync
      try {
        const { error } = await supabase.from("settings").upsert({ key: dbKey, value: newList });
        if (error) console.warn("Supabase settings upsert error (using local):", error.message);
      } catch (e) {
        console.warn("Supabase settings upsert exception (using local):", e);
      }

      return newList;
    },
    onMutate: async (newList) => {
      await queryClient.cancelQueries({ queryKey: ["settings", dbKey] });
      const prev = queryClient.getQueryData<string[]>(["settings", dbKey]);
      queryClient.setQueryData(["settings", dbKey], newList);
      return { prev };
    },
    onError: (_err, _newList, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["settings", dbKey], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", dbKey] });
    },
  });

  const add = useCallback(
    (value: string) => {
      const v = value.trim();
      if (!v) return "الرجاء إدخال اسم صالح.";
      if (options.some((o) => normalizeOptionValue(o) === normalizeOptionValue(v))) {
        return `العنصر «${v}» موجود مسبقًا، لا يمكن التكرار.`;
      }
      const next = [...options, v];
      mutation.mutate(next);
      return null;
    },
    [options, mutation],
  );

  const rename = useCallback(
    (oldValue: string, nextValue: string) => {
      const v = nextValue.trim();
      if (!v) return "الرجاء إدخال اسم صالح.";
      if (
        options.some(
          (o) => o !== oldValue && normalizeOptionValue(o) === normalizeOptionValue(v),
        )
      ) {
        return `العنصر «${v}» موجود مسبقًا، لا يمكن التكرار.`;
      }
      const next = options.map((o) => (o === oldValue ? v : o));
      mutation.mutate(next);
      return null;
    },
    [options, mutation],
  );

  const remove = useCallback(
    (value: string) => {
      const next = options.filter((o) => o !== value);
      mutation.mutate(next);
    },
    [options, mutation],
  );

  const reset = useCallback(() => {
    mutation.mutate(base);
  }, [base, mutation]);

  return { options, add, rename, remove, reset };
}
