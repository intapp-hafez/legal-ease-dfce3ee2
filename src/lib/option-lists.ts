import { useCallback, useEffect, useMemo, useState } from "react";

/** Generic, persisted, editable option list used by "النوع / التصنيف" style selects. */

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

const EVENT = "option-list-changed";

function read(key: string, base: string[]): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    /* ignore */
  }
  return base;
}

function write(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
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
  const [options, setOptions] = useState<string[]>(base);
  const baseRef = useMemo(() => base, [base]);

  useEffect(() => {
    const sync = () => setOptions(read(key, baseRef));
    sync();
    const onEvt = (e: Event) => {
      if ((e as CustomEvent).detail === key) sync();
    };
    window.addEventListener(EVENT, onEvt);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, onEvt);
      window.removeEventListener("storage", sync);
    };
  }, [key, baseRef]);

  const add = useCallback(
    (value: string) => {
      const v = value.trim();
      if (!v) return "الرجاء إدخال اسم صالح.";
      const current = read(key, baseRef);
      if (current.some((o) => normalizeOptionValue(o) === normalizeOptionValue(v)))
        return `الاسم «${v}» موجود مسبقًا، لا يمكن التكرار.`;
      write(key, [...current, v]);
      return null;
    },
    [key, baseRef],
  );

  const rename = useCallback(
    (oldValue: string, next: string) => {
      const v = next.trim();
      if (!v) return "الرجاء إدخال اسم صالح.";
      const current = read(key, baseRef);
      if (
        current.some(
          (o) => o !== oldValue && normalizeOptionValue(o) === normalizeOptionValue(v),
        )
      )
        return `الاسم «${v}» موجود مسبقًا، لا يمكن التكرار.`;
      write(key, current.map((o) => (o === oldValue ? v : o)));
      return null;
    },
    [key, baseRef],
  );

  const remove = useCallback(
    (value: string) => write(key, read(key, baseRef).filter((o) => o !== value)),
    [key, baseRef],
  );

  const reset = useCallback(() => write(key, baseRef), [key, baseRef]);

  return { options, add, rename, remove, reset };
}
