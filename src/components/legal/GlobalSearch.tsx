import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpLeft, FileSearch, Search, X } from "lucide-react";
import { useAuth, type ModuleId } from "@/lib/auth";
import {
  assets,
  cases,
  companyDocuments,
  contracts,
  repository,
  requests,
  roles,
  tasks,
  violations,
} from "@/lib/legal-data";
import type { Row } from "@/lib/crud";

type SearchSource = {
  module: ModuleId;
  label: string;
  path: string;
  storageKey: string;
  seed: Row[];
  titleKeys: string[];
  idKeys: string[];
};

type SearchResult = {
  key: string;
  module: ModuleId;
  moduleLabel: string;
  path: string;
  title: string;
  detail: string;
};

const sources: SearchSource[] = [
  { module: "documents", label: "مستندات الشركة", path: "/documents", storageKey: "documents", seed: companyDocuments, titleKeys: ["name", "category"], idKeys: ["no"] },
  { module: "contracts", label: "عقود الموظفين", path: "/contracts", storageKey: "contracts", seed: contracts, titleKeys: ["employee", "type"], idKeys: ["no", "code"] },
  { module: "custody", label: "عهد الموظفين", path: "/custody", storageKey: "assets", seed: assets, titleKeys: ["name", "employee"], idKeys: ["code", "serial"] },
  { module: "cases", label: "القضايا القانونية", path: "/cases", storageKey: "cases", seed: cases, titleKeys: ["name", "opponent"], idKeys: ["no"] },
  { module: "tasks", label: "المهام اليومية", path: "/tasks", storageKey: "tasks", seed: tasks, titleKeys: ["title", "category"], idKeys: ["no"] },
  { module: "violations", label: "مخالفات الموظفين", path: "/violations", storageKey: "violations", seed: violations, titleKeys: ["employee", "type"], idKeys: ["no"] },
  { module: "requests", label: "الطلبات القانونية", path: "/requests", storageKey: "requests", seed: requests, titleKeys: ["type", "employee"], idKeys: ["no"] },
  { module: "repository", label: "مستودع المستندات", path: "/repository", storageKey: "repository", seed: repository, titleKeys: ["folder", "feature"], idKeys: [] },
  { module: "settings", label: "الأدوار والصلاحيات", path: "/settings", storageKey: "roles", seed: roles, titleKeys: ["role", "perms"], idKeys: [] },
];

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("ar")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

function readRows(source: SearchSource): Row[] {
  if (typeof window === "undefined") return source.seed;
  try {
    const raw = window.localStorage.getItem(`int-legal:${source.storageKey}`);
    if (!raw) return source.seed;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Row[]) : source.seed;
  } catch {
    return source.seed;
  }
}

function firstValue(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = String(row[key] ?? "").trim();
    if (value && value !== "—") return value;
  }
  return "سجل";
}

export function GlobalSearch() {
  const { can } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];

    const matches: SearchResult[] = [];
    for (const source of sources) {
      if (!can(source.module)) continue;
      for (const [index, row] of readRows(source).entries()) {
        if (!normalize(Object.values(row).join(" ")).includes(q)) continue;
        const title = firstValue(row, source.titleKeys);
        const id = firstValue(row, source.idKeys);
        const detailParts = [id === "سجل" ? "" : id, source.label].filter(Boolean);
        matches.push({
          key: `${source.storageKey}-${id}-${index}`,
          module: source.module,
          moduleLabel: source.label,
          path: source.path,
          title,
          detail: detailParts.join(" • "),
        });
      }
    }
    return matches.slice(0, 12);
  }, [query, can]);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function clear() {
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 max-w-xl">
      <Search className="pointer-events-none absolute right-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-10 w-full rounded-lg border border-border bg-card pr-9 pl-9 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
        placeholder="بحث شامل: موظف، رقم عقد، مستند، قضية، رقم عهدة…"
        aria-label="البحث الشامل"
        role="combobox"
        aria-expanded={open && Boolean(query.trim())}
        aria-controls="global-search-results"
        autoComplete="off"
      />
      {query ? (
        <button
          type="button"
          onClick={clear}
          aria-label="مسح البحث"
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}

      {open && query.trim() ? (
        <div
          id="global-search-results"
          className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
            <span>نتائج البحث</span>
            <span>{results.length} نتيجة</span>
          </div>
          {results.length ? (
            <div className="max-h-[min(420px,65vh)] overflow-y-auto p-1.5">
              {results.map((result) => (
                <Link
                  key={result.key}
                  to={result.path}
                  onClick={clear}
                  className="group flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-secondary focus:bg-secondary focus:outline-none"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/12 text-[var(--primary-ink)]">
                    <FileSearch className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-card-foreground">{result.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{result.detail}</span>
                  </span>
                  <ArrowUpLeft className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <FileSearch className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-card-foreground">لا توجد نتائج مطابقة</p>
              <p className="mt-1 text-xs text-muted-foreground">جرّب الاسم أو الرقم أو نوع السجل</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}