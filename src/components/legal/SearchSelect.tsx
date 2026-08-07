import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";

function norm(s: string) {
  return s
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/[أإآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim()
    .toLowerCase();
}

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allLabel: string;
  onAddOption?: (v: string) => void;
  addLabel?: string;
};

export function SearchSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  onAddOption,
  addLabel = "إضافة خيار جديد",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const all = ["", ...options];
    if (!query.trim()) return all;
    const q = norm(query);
    return all.filter((o) => (o === "" ? norm(allLabel).includes(q) : norm(o).includes(q)));
  }, [options, query, allLabel]);

  const canCreate =
    !!onAddOption &&
    query.trim().length > 0 &&
    !options.some((o) => norm(o) === norm(query));

  const total = items.length + (canCreate ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const commit = (idx: number) => {
    if (canCreate && idx === items.length) {
      const v = query.trim();
      onAddOption?.(v);
      onChange(v);
    } else {
      const v = items[idx];
      if (v === undefined) return;
      onChange(v);
    }
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (total ? (a + 1) % total : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (total ? (a - 1 + total) % total : 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(Math.max(0, total - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className="block text-sm" ref={rootRef}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <div className="flex gap-2">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            onKeyDown={(e) => {
              if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            className="flex h-10 flex-1 items-center justify-between rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          >
            <span className={value ? "" : "text-muted-foreground"}>{value || allLabel}</span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </button>
          {onAddOption && (
            <button
              type="button"
              title={addLabel}
              aria-label={addLabel}
              onClick={() => {
                setOpen(true);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-foreground outline-none hover:bg-muted focus:ring-2 focus:ring-ring/40"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="h-4 w-4 shrink-0 opacity-60" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="ابحث أو اكتب اسمًا جديدًا…"
                className="h-10 w-full bg-transparent text-sm outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="مسح البحث"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
              {items.map((o, i) => (
                <button
                  key={o || "__all"}
                  type="button"
                  data-idx={i}
                  role="option"
                  aria-selected={o === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => commit(i)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-right text-sm ${
                    i === active ? "bg-muted" : ""
                  }`}
                >
                  <span className={o ? "" : "text-muted-foreground"}>{o || allLabel}</span>
                  {o === value && <Check className="h-4 w-4 opacity-70" />}
                </button>
              ))}
              {canCreate && (
                <button
                  type="button"
                  data-idx={items.length}
                  onMouseEnter={() => setActive(items.length)}
                  onClick={() => commit(items.length)}
                  className={`flex w-full items-center gap-2 border-t border-border px-3 py-2 text-right text-sm ${
                    active === items.length ? "bg-muted" : ""
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    {addLabel}: «{query.trim()}»
                  </span>
                </button>
              )}
              {items.length === 0 && !canCreate && (
                <p className="px-3 py-3 text-sm text-muted-foreground">لا توجد نتائج</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
