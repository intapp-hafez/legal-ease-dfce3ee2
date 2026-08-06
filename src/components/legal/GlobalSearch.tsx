import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpLeft, FileSearch, Search, SlidersHorizontal, X } from "lucide-react";
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
  typeKeys: string[];
  dateKeys: string[];
};

type SearchResult = {
  key: string;
  module: ModuleId;
  moduleLabel: string;
  path: string;
  title: string;
  detail: string;
  type: string;
  date: string;
};

const sources: SearchSource[] = [
  { module: "documents", label: "مستندات الشركة", path: "/documents", storageKey: "documents", seed: companyDocuments, titleKeys: ["name", "category"], idKeys: ["no"], typeKeys: ["category"], dateKeys: ["expiry", "issue"] },
  { module: "contracts", label: "عقود الموظفين", path: "/contracts", storageKey: "contracts", seed: contracts, titleKeys: ["employee", "type"], idKeys: ["no", "code"], typeKeys: ["type"], dateKeys: ["start", "end"] },
  { module: "custody", label: "عهد الموظفين", path: "/custody", storageKey: "assets", seed: assets, titleKeys: ["name", "employee"], idKeys: ["code", "serial"], typeKeys: ["category"], dateKeys: ["date", "assigned"] },
  { module: "cases", label: "القضايا القانونية", path: "/cases", storageKey: "cases", seed: cases, titleKeys: ["name", "opponent"], idKeys: ["no"], typeKeys: ["type"], dateKeys: ["hearing", "start"] },
  { module: "tasks", label: "المهام اليومية", path: "/tasks", storageKey: "tasks", seed: tasks, titleKeys: ["title", "category"], idKeys: ["no"], typeKeys: ["category"], dateKeys: ["due"] },
  { module: "violations", label: "مخالفات الموظفين", path: "/violations", storageKey: "violations", seed: violations, titleKeys: ["employee", "type"], idKeys: ["no"], typeKeys: ["type"], dateKeys: ["date"] },
  { module: "requests", label: "الطلبات القانونية", path: "/requests", storageKey: "requests", seed: requests, titleKeys: ["type", "employee"], idKeys: ["no"], typeKeys: ["type"], dateKeys: ["date"] },
  { module: "repository", label: "مستودع المستندات", path: "/repository", storageKey: "repository", seed: repository, titleKeys: ["folder", "feature"], idKeys: [], typeKeys: ["feature"], dateKeys: ["updated"] },
  { module: "settings", label: "الأدوار والصلاحيات", path: "/settings", storageKey: "roles", seed: roles, titleKeys: ["role", "perms"], idKeys: [], typeKeys: ["role"], dateKeys: [] },
];

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("ar")
    .replace(/[ًٌٍَُِّْـ]/g, "")
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

function rowDate(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = String(row[key] ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  }
  for (const value of Object.values(row)) {
    const text = String(value ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  }
  return "";
}

export function GlobalSearch() {
  const { can } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<"all" | ModuleId>("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const allowedSources = useMemo(() => sources.filter((s) => can(s.module)), [can]);

  const scanned = useMemo(() => {
    const rows: { source: SearchSource; row: Row; index: number }[] = [];
    for (const source of allowedSources) {
      if (moduleFilter !== "all" && source.module !== moduleFilter) continue;
      readRows(source).forEach((row, index) => rows.push({ source, row, index }));
    }
    return rows;
  }, [allowedSources, moduleFilter, open]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const { source, row } of scanned) {
      const type = firstValue(row, source.typeKeys);
      if (type !== "سجل") set.add(type);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [scanned]);

  const activeFilters =
    (moduleFilter !== "all" ? 1 : 0) + (typeFilter ? 1 : 0) + (fromDate ? 1 : 0) + (toDate ? 1 : 0);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q && !activeFilters) return [];

    const matches: SearchResult[] = [];
    for (const { source, row, index } of scanned) {
      if (q && !normalize(Object.values(row).join(" ")).includes(q)) continue;

      const type = firstValue(row, source.typeKeys);
      if (typeFilter && type !== typeFilter) continue;

      const date = rowDate(row, source.dateKeys);
      if ((fromDate || toDate) && !date) continue;
      if (fromDate && date < fromDate) continue;
      if (toDate && date > toDate) continue;

      const id = firstValue(row, source.idKeys);
      const title = firstValue(row, source.titleKeys);
      const detailParts = [id === "سجل" ? "" : id, source.label, date].filter(Boolean);
      matches.push({
        key: `${source.storageKey}-${id}-${index}`,
        module: source.module,
        moduleLabel: source.label,
        path: source.path,
        title,
        detail: detailParts.join(" • "),
        type: type === "سجل" ? "" : type,
        date,
      });
    }
    return matches.slice(0, 30);
  }, [query, scanned, typeFilter, fromDate, toDate, activeFilters]);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function clear() {
    setQuery("");
    setOpen(false);
  }

  function resetFilters() {
    setModuleFilter("all");
    setTypeFilter("");
    setFromDate("");
    setToDate("");
  }

  const panelOpen = open && (Boolean(query.trim()) || activeFilters > 0 || showFilters);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 max-w-xl">
      <Search className="pointer-events-none absolute right-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="h-10 w-full rounded-lg border border-border bg-card pr-9 pl-24 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
        placeholder="بحث شامل: موظف، رقم عقد، مستند، قضية، رقم عهدة…"
        aria-label="البحث الشامل"
        role="combobox"
        aria-expanded={panelOpen}
        aria-controls="global-search-results"
        autoComplete="off"
      />

      <div className="absolute left-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
        {query ? (
          <button
            type="button"
            onClick={clear}
            aria-label="مسح البحث"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setShowFilters((v) => !v);
            setOpen(true);
          }}
          aria-label="بحث متقدم"
          aria-pressed={showFilters}
          className={`relative rounded-md p-1 hover:bg-secondary ${activeFilters ? "text-[var(--primary-ink)]" : "text-muted-foreground"}`}
        >
          <SlidersHorizontal className="size-3.5" />
          {activeFilters ? (
            <span className="absolute -top-1 -left-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {activeFilters}
            </span>
          ) : null}
        </button>
        <kbd className="hidden select-none rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
          Ctrl K
        </kbd>
      </div>

      {panelOpen ? (
        <div
          id="global-search-results"
          className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          {showFilters ? (
            <div className="grid gap-2 border-b border-border p-3 sm:grid-cols-2">
              <label className="text-[11px] text-muted-foreground">
                القسم
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value as "all" | ModuleId)}
                  className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="all">كل الأقسام</option>
                  {allowedSources.map((s) => (
                    <option key={s.module} value={s.module}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] text-muted-foreground">
                النوع / التصنيف
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="">كل الأنواع</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] text-muted-foreground">
                من تاريخ
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
                />
              </label>
              <label className="text-[11px] text-muted-foreground">
                إلى تاريخ
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
                />
              </label>
              {activeFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="justify-self-start rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary"
                >
                  مسح التصفية
                </button>
              ) : null}
            </div>
          ) : null}

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
              <p className="mt-1 text-xs text-muted-foreground">جرّب الاسم أو الرقم أو وسّع نطاق التاريخ</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
