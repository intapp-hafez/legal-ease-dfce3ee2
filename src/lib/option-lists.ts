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
      const { data } = await supabase.from("settings").select("value").eq("key", dbKey).single();
      if (data?.value && Array.isArray(data.value)) return data.value as string[];
      return base;
    }
  });

  const mutation = useMutation({
    mutationFn: async (newList: string[]) => {
      await supabase.from("settings").upsert({ key: dbKey, value: newList });
      return newList;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", dbKey] })
  });

  const add = useCallback(
    (value: string) => {
      const v = value.trim();
      if (!v) return "الرجاء إدخال اسم صالح.";
      if (options.some((o) => normalizeOptionValue(o) === normalizeOptionValue(v)))
        return `الاسم «${v}» موجود مسبقًا، لا يمكن التكرار.`;
      mutation.mutate([...options, v]);
      return null;
    },
    [options, mutation],
  );

  const rename = useCallback(
    (oldValue: string, next: string) => {
      const v = next.trim();
      if (!v) return "الرجاء إدخال اسم صالح.";
      if (
        options.some(
          (o) => o !== oldValue && normalizeOptionValue(o) === normalizeOptionValue(v),
        )
      )
        return `الاسم «${v}» موجود مسبقًا، لا يمكن التكرار.`;
      mutation.mutate(options.map((o) => (o === oldValue ? v : o)));
      return null;
    },
    [options, mutation],
  );

  const remove = useCallback(
    (value: string) => mutation.mutate(options.filter((o) => o !== value)),
    [options, mutation],
  );

  const reset = useCallback(() => mutation.mutate(base), [base, mutation]);

  return { options, add, rename, remove, reset };
}
