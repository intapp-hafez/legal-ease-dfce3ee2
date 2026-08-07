import { useCallback, useEffect, useState } from "react";

export const baseCategories = [
  "لابتوب",
  "جهاز مكتبي",
  "شاشة",
  "هاتف محمول",
  "تابلت",
  "شريحة اتصال",
  "طابعة",
  "ماسح ضوئي",
  "مركبة",
  "مفاتيح مكتب",
  "بطاقة دخول",
  "راوتر",
  "سماعة رأس",
  "بطارية متنقلة",
  "توكن USB",
  "مفتاح أمان",
  "معدات أخرى",
];

export const baseStatuses = [
  "متاحة",
  "مُسندة",
  "مُرجعة",
  "بانتظار الإرجاع",
  "مفقودة",
  "تالفة",
  "صيانة",
  "مستبعدة",
];

export const CATEGORY_KEY = "custody-categories";
export const STATUS_KEY = "custody-statuses";

const LEGACY: Record<string, string> = {
  [CATEGORY_KEY]: "custody-extra-categories",
  [STATUS_KEY]: "custody-extra-statuses",
};

export function normalizeOption(s: string) {
  return s
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/[أإآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const EVENT = "custody-options-changed";

function read(key: string, base: string[]): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as string[];
    const legacy = localStorage.getItem(LEGACY[key] ?? "");
    if (legacy) return [...base, ...(JSON.parse(legacy) as string[])];
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

export type OptionsApi = {
  options: string[];
  /** returns an error message, or null on success */
  add: (value: string) => string | null;
  rename: (oldValue: string, next: string) => string | null;
  remove: (value: string) => void;
  reset: () => void;
};

export function useOptionList(key: string, base: string[]): OptionsApi {
  const [options, setOptions] = useState<string[]>(base);

  useEffect(() => {
    const sync = () => setOptions(read(key, base));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const add = useCallback(
    (value: string) => {
      const v = value.trim();
      if (!v) return "الرجاء إدخال اسم صالح.";
      const current = read(key, base);
      if (current.some((o) => normalizeOption(o) === normalizeOption(v)))
        return `الاسم «${v}» موجود مسبقًا، لا يمكن التكرار.`;
      write(key, [...current, v]);
      return null;
    },
    [key, base],
  );

  const rename = useCallback(
    (oldValue: string, next: string) => {
      const v = next.trim();
      if (!v) return "الرجاء إدخال اسم صالح.";
      const current = read(key, base);
      if (
        current.some(
          (o) => o !== oldValue && normalizeOption(o) === normalizeOption(v),
        )
      )
        return `الاسم «${v}» موجود مسبقًا، لا يمكن التكرار.`;
      write(
        key,
        current.map((o) => (o === oldValue ? v : o)),
      );
      return null;
    },
    [key, base],
  );

  const remove = useCallback(
    (value: string) => {
      write(
        key,
        read(key, base).filter((o) => o !== value),
      );
    },
    [key, base],
  );

  const reset = useCallback(() => write(key, base), [key, base]);

  return { options, add, rename, remove, reset };
}

export const useCategories = () => useOptionList(CATEGORY_KEY, baseCategories);
export const useStatuses = () => useOptionList(STATUS_KEY, baseStatuses);
