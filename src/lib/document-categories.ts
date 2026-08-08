import { useCallback, useEffect, useState } from "react";

export const baseDocumentCategories = [
  "السجل التجاري",
  "البطاقة الضريبية",
  "شهادة ضريبة القيمة المضافة",
  "الغرفة التجارية",
  "رخصة استيراد",
  "رخصة تصدير",
  "بوالص التأمين",
  "شهادات العلامات التجارية",
  "سياسات الشركة",
  "عقود الإيجار",
  "التراخيص الحكومية",
  "نماذج عدم الإفصاح",
  "اتفاقيات الشراكة",
  "عقود الموردين",
  "عقود العملاء",
  "مستندات قانونية داخلية",
];

export const DOCUMENT_CATEGORY_KEY = "document-categories";

const LEGACY = {
  [DOCUMENT_CATEGORY_KEY]: "document-extra-categories",
};

export function normalizeDocumentCategory(s: string) {
  return s
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/[أإآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const EVENT = "document-categories-changed";

function read(base: string[]): string[] {
  try {
    const raw = localStorage.getItem(DOCUMENT_CATEGORY_KEY);
    if (raw) return JSON.parse(raw) as string[];
    const legacy = localStorage.getItem(LEGACY[DOCUMENT_CATEGORY_KEY]);
    if (legacy) return [...base, ...(JSON.parse(legacy) as string[])];
  } catch {
    /* ignore */
  }
  return base;
}

function write(list: string[]) {
  try {
    localStorage.setItem(DOCUMENT_CATEGORY_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: DOCUMENT_CATEGORY_KEY }));
}

export type DocumentCategoriesApi = {
  options: string[];
  /** returns an error message, or null on success */
  add: (value: string) => string | null;
  rename: (oldValue: string, next: string) => string | null;
  remove: (value: string) => void;
  reset: () => void;
};

export function useDocumentCategories(): DocumentCategoriesApi {
  const [options, setOptions] = useState<string[]>(baseDocumentCategories);

  useEffect(() => {
    const sync = () => setOptions(read(baseDocumentCategories));
    sync();
    const onEvt = (e: Event) => {
      if ((e as CustomEvent).detail === DOCUMENT_CATEGORY_KEY) sync();
    };
    window.addEventListener(EVENT, onEvt);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, onEvt);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((value: string) => {
    const v = value.trim();
    if (!v) return "الرجاء إدخال اسم صالح.";
    const current = read(baseDocumentCategories);
    if (current.some((o) => normalizeDocumentCategory(o) === normalizeDocumentCategory(v))) {
      return `الاسم «${v}» موجود مسبقًا، لا يمكن التكرار.`;
    }
    write([...current, v]);
    return null;
  }, []);

  const rename = useCallback((oldValue: string, next: string) => {
    const v = next.trim();
    if (!v) return "الرجاء إدخال اسم صالح.";
    const current = read(baseDocumentCategories);
    if (
      current.some(
        (o) => o !== oldValue && normalizeDocumentCategory(o) === normalizeDocumentCategory(v),
      )
    )
      return `الاسم «${v}» موجود مسبقًا، لا يمكن التكرار.`;
    write(current.map((o) => (o === oldValue ? v : o)));
    return null;
  }, []);

  const remove = useCallback((value: string) => {
    write(read(baseDocumentCategories).filter((o) => o !== value));
  }, []);

  const reset = useCallback(() => write(baseDocumentCategories), []);

  return { options, add, rename, remove, reset };
}
