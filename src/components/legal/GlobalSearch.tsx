import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowUpLeft,
  Clock,
  CornerDownLeft,
  FileSearch,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
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

type SavedSearch = {
  query: string;
  moduleFilter: "all" | ModuleId;
  typeFilter: string;
  fromDate: string;
  toDate: string;
  at: number;
};

const HISTORY_KEY = "int-legal:search-history";

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

function readHistory(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedSearch[]) : [];
  } catch {
    return [];
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

function describeSaved(item: SavedSearch) {
  const bits: string[] = [];
  if (item.moduleFilter !== "all") {
    bits.push(sources.find((s) => s.module === item.moduleFilter)?.label ?? item.moduleFilter);
  }
  if (item.typeFilter) bits.push(item.typeFilter);
  if (item.fromDate || item.toDate) bits.push(`${item.fromDate || "…"} → ${item.toDate || "…"}`);
  return bits.join(" • ");
}

function Highlight({ text, query, className }: { text: string; query: string; className?: string }) {
  const q = normalize(query).trim();
  if (!q || !text) return <span className={className}>{text}</span>;

  const chars = Array.from(text);
  const map: number[] = [];
  const norm: string[] = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === undefined) continue;
    if (/[ًٌٍَُِّْـ]/.test(c)) continue;
    const nc = normalize(c);
    map.push(i);
    norm.push(nc);
  }
  const normalizedString = norm.join("");
  const start = normalizedString.indexOf(q);
  if (start === -1) return <span className={className}>{text}</span>;

  const end = start + q.length;
  const startOriginal = map[start];
  const endOriginal = end < map.length ? map[end] : text.length;
  const before = text.slice(0, startOriginal);
  const match = text.slice(startOriginal, endOriginal);
  const after = text.slice(endOriginal);

  return (
    <span className={className}>
      {before}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-[var(--primary-ink)]">{match}</mark>
      {after}
    </span>
  );
}


export function GlobalSearch() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<"all" | ModuleId>("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [history, setHistory] = useState<SavedSearch[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

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

  // اقتراحات تلقائية من عناوين الوثائق والقضايا والأسماء
  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    const set = new Set<string>();
    for (const { source, row } of scanned) {
      for (const key of [...source.titleKeys, ...source.idKeys]) {
        const value = String(row[key] ?? "").trim();
        if (!value || value === "—") continue;
        const n = normalize(value);
        if (n.includes(q) && n !== q) set.add(value);
        if (set.size > 40) break;
      }
    }
    return Array.from(set).slice(0, 6);
  }, [query, scanned]);

  const recents = query.trim() ? [] : history.slice(0, 6);

  type Item =
    | { kind: "recent"; saved: SavedSearch }
    | { kind: "suggestion"; text: string }
    | { kind: "result"; result: SearchResult };

  const items: Item[] = useMemo(
    () => [
      ...recents.map((saved) => ({ kind: "recent" as const, saved })),
      ...suggestions.map((text) => ({ kind: "suggestion" as const, text })),
      ...results.map((result) => ({ kind: "result" as const, result })),
    ],
    [recents, suggestions, results],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, moduleFilter, typeFilter, fromDate, toDate, open]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, items.length]);

  const saveSearch = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed && !activeFilters) return;
      const entry: SavedSearch = {
        query: trimmed,
        moduleFilter,
        typeFilter,
        fromDate,
        toDate,
        at: Date.now(),
      };
      setHistory((prev) => {
        const next = [
          entry,
          ...prev.filter(
            (p) =>
              !(
                p.query === entry.query &&
                p.moduleFilter === entry.moduleFilter &&
                p.typeFilter === entry.typeFilter &&
                p.fromDate === entry.fromDate &&
                p.toDate === entry.toDate
              ),
          ),
        ].slice(0, 8);
        try {
          window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [activeFilters, moduleFilter, typeFilter, fromDate, toDate],
  );

  function clearHistory() {
    setHistory([]);
    try {
      window.localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  }

  function applySaved(saved: SavedSearch) {
    setQuery(saved.query);
    setModuleFilter(saved.moduleFilter);
    setTypeFilter(saved.typeFilter);
    setFromDate(saved.fromDate);
    setToDate(saved.toDate);
    setOpen(true);
    if (saved.typeFilter || saved.fromDate || saved.toDate || saved.moduleFilter !== "all") setShowFilters(true);
    inputRef.current?.focus();
  }

  function openResult(result: SearchResult) {
    saveSearch(query);
    setOpen(false);
    setQuery("");
    void navigate({ to: result.path });
  }

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
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Tab") {
      if (!items.length) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => {
        const isDown = event.key === "ArrowDown" || (!event.shiftKey && event.key === "Tab");
        const next = isDown ? i + 1 : i - 1;
        return (next + items.length) % items.length;
      });
      return;
    }
    if (event.key === "Home" && items.length) {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End" && items.length) {
      event.preventDefault();
      setActiveIndex(items.length - 1);
      return;
    }
    if (event.key === "Enter") {
      const item = items[activeIndex];
      if (!item) {
        saveSearch(query);
        return;
      }
      event.preventDefault();
      if (item.kind === "recent") applySaved(item.saved);
      else if (item.kind === "suggestion") {
        setQuery(item.text);
        setOpen(true);
      } else openResult(item.result);
    }
  }


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

  const panelOpen =
    open && (Boolean(query.trim()) || activeFilters > 0 || showFilters || recents.length > 0);

  const rowBase =
    "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-right focus:outline-none";
  const activeCls = "bg-secondary ring-1 ring-ring/40";

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
        onKeyDown={onInputKeyDown}
        className="h-10 w-full rounded-lg border border-border bg-card pr-9 pl-24 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
        placeholder="بحث شامل: موظف، رقم عقد، مستند، قضية، رقم عهدة…"
        aria-label="البحث الشامل"
        role="combobox"
        aria-expanded={panelOpen}
        aria-controls="global-search-results"
        aria-activedescendant={panelOpen && items.length ? `gs-item-${activeIndex}` : undefined}
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
          role="listbox"
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

          <div ref={listRef} className="max-h-[min(460px,68vh)] overflow-y-auto">
            {recents.length ? (
              <div className="border-b border-border p-1.5">
                <div className="flex items-center justify-between px-2 py-1 text-[11px] text-muted-foreground">
                  <span>عمليات بحث سابقة</span>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-secondary hover:text-foreground"
                  >
                    <Trash2 className="size-3" />
                    مسح السجل
                  </button>
                </div>
                {recents.map((saved, i) => {
                  const isActive = activeIndex === i;
                  return (
                    <button
                      key={`${saved.at}-${i}`}
                      id={`gs-item-${i}`}
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      type="button"
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => applySaved(saved)}
                      className={`${rowBase} ${isActive ? activeCls : "hover:bg-secondary"}`}
                    >
                      <Clock className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-card-foreground">
                          {saved.query || "بحث بالمرشحات فقط"}
                        </span>
                        {describeSaved(saved) ? (
                          <span className="block truncate text-xs text-muted-foreground">{describeSaved(saved)}</span>
                        ) : null}
                      </span>
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            ) : null}

            {suggestions.length ? (
              <div className="border-b border-border p-1.5">
                <div className="px-2 py-1 text-[11px] text-muted-foreground">اقتراحات</div>
                {suggestions.map((text, i) => {
                  const index = recents.length + i;
                  const isActive = activeIndex === index;
                  return (
                    <button
                      key={text}
                      id={`gs-item-${index}`}
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        setQuery(text);
                        inputRef.current?.focus();
                      }}
                      className={`${rowBase} py-2 ${isActive ? activeCls : "hover:bg-secondary"}`}
                    >
                      <Sparkles className="size-4 shrink-0 text-[var(--primary-ink)]" />
                      <span className="min-w-0 flex-1 truncate text-sm text-card-foreground">{text}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">تعبئة</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
              <span>نتائج البحث</span>
              <span>{results.length} نتيجة</span>
            </div>

            {results.length ? (
              <div className="p-1.5">
                {results.map((result, i) => {
                  const index = recents.length + suggestions.length + i;
                  const isActive = activeIndex === index;
                  return (
                    <button
                      key={result.key}
                      id={`gs-item-${index}`}
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => openResult(result)}
                      className={`${rowBase} ${isActive ? activeCls : "hover:bg-secondary"}`}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/12 text-[var(--primary-ink)]">
                        <FileSearch className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-card-foreground">{result.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{result.detail}</span>
                      </span>
                      <ArrowUpLeft className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <FileSearch className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-2 text-sm text-card-foreground">لا توجد نتائج مطابقة</p>
                <p className="mt-1 text-xs text-muted-foreground">جرّب الاسم أو الرقم أو وسّع نطاق التاريخ</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
            <span>↑ ↓ Tab للتنقل</span>
            <span>Enter للفتح</span>
            <span>Esc للإغلاق</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
