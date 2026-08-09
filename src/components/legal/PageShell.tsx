import type { ReactNode } from "react";

export function PageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-6 md:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-card shadow-[var(--shadow-panel)] ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

const toneMap: Record<string, string> = {
  نشط: "bg-success/12 text-success border-success/25",
  معتمد: "bg-success/12 text-success border-success/25",
  مكتمل: "bg-success/12 text-success border-success/25",
  مكتملة: "bg-success/12 text-success border-success/25",
  مغلقة: "bg-muted text-muted-foreground border-border",
  متاحة: "bg-success/12 text-success border-success/25",
  "مُسندة": "bg-accent/15 text-[var(--accent-ink)] border-accent/30",
  "موقّع": "bg-accent/15 text-[var(--accent-ink)] border-accent/30",
  "قيد المراجعة": "bg-warning/15 text-[var(--warning-ink)] border-warning/30",
  "قيد المعالجة": "bg-warning/15 text-[var(--warning-ink)] border-warning/30",
  "قيد التنفيذ": "bg-accent/15 text-[var(--accent-ink)] border-accent/30",
  "قيد التحقيق": "bg-warning/15 text-[var(--warning-ink)] border-warning/30",
  "بانتظار": "bg-warning/15 text-[var(--warning-ink)] border-warning/30",
  "بانتظار الإرجاع": "bg-warning/15 text-[var(--warning-ink)] border-warning/30",
  صيانة: "bg-warning/15 text-[var(--warning-ink)] border-warning/30",
  منتهي: "bg-destructive/12 text-destructive border-destructive/25",
  متأخرة: "bg-destructive/12 text-destructive border-destructive/25",
  مفقودة: "bg-destructive/12 text-destructive border-destructive/25",
  مفتوحة: "bg-accent/15 text-[var(--accent-ink)] border-accent/30",
  "أمام المحكمة": "bg-accent/15 text-[var(--accent-ink)] border-accent/30",
  جديد: "bg-secondary text-secondary-foreground border-border",
  جديدة: "bg-secondary text-secondary-foreground border-border",
  مسودة: "bg-secondary text-secondary-foreground border-border",
  "مؤرشف": "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ value, onChange, options }: { value: string; onChange?: (val: string) => void; options?: string[] }) {
  const cls = toneMap[value] ?? "bg-secondary text-secondary-foreground border-border";
  
  if (onChange && options) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 pl-6 text-xs font-medium outline-none cursor-pointer ${cls}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-background text-foreground">
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {value}
    </span>
  );
}

export function DataTable({
  columns,
  rows,
  onRowClick,
}: {
  columns: string[];
  rows: ReactNode[][];
  onRowClick?: (rowIndex: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-right text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(i)}
              className={`border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/60 ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {row.map((cell, j) => (
                <td key={j} className="whitespace-nowrap px-3 py-3 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TagList({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected?: string;
  onSelect?: (value: string) => void;
}) {
  if (!onSelect) {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((t) => (
          <span
            key={t}
            className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => {
        const active = selected === t;
        return (
          <button
            key={t}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? "" : t)}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-secondary-foreground hover:border-primary/40 hover:bg-primary/10"
            }`}
          >
            {t}
          </button>
        );
      })}
      {selected ? (
        <button
          type="button"
          onClick={() => onSelect("")}
          className="rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary"
        >
          مسح التصفية
        </button>
      ) : null}
    </div>
  );
}

