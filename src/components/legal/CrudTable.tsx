import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Download, Pencil, Plus, RotateCcw, Search, Trash2, Upload, X } from "lucide-react";
import { Panel, StatusPill } from "@/components/legal/PageShell";
import { ImportWizard, type ImportResult } from "@/components/legal/ImportWizard";
import { useCollection, nextId, type Row } from "@/lib/crud";
import { downloadTemplate } from "@/lib/excel";
import { logAudit, CURRENT_USER } from "@/lib/audit";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "status" | "progress" | "mono";
  options?: string[];
  required?: boolean;
  hideInForm?: boolean;
};

type Props<T extends Row> = {
  title: string;
  storageKey: string;
  seed: T[];
  idKey: string;
  idPrefix: string;
  fields: Field[];
  className?: string;
  addLabel?: string;
  subtitle?: string;
  extraActions?: ReactNode;
};

function emptyRow(fields: Field[]): Row {
  const r: Row = {};
  for (const f of fields) r[f.key] = f.type === "number" || f.type === "progress" ? 0 : "";
  return r;
}

export function CrudTable<T extends Row>({
  title,
  storageKey,
  seed,
  idKey,
  idPrefix,
  fields,
  className = "",
  addLabel = "إضافة",
  subtitle,
}: Props<T>) {
  const { items, create, update, remove, reset, replaceAll } = useCollection<T>(
    storageKey,
    seed,
    idKey,
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Row>(() => emptyRow(fields));
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function finishImport(next: T[], r: ImportResult) {
    replaceAll(next);
    const summary = `إضافة: ${r.added} • تحديث: ${r.updated} • تخطي: ${r.skipped} • فشل: ${r.failed}`;
    logAudit({
      action: `استيراد Excel — ${title}`,
      target: storageKey,
      details: summary,
    });
    setImportMsg({
      ok: r.failed === 0,
      text: `تم الاستيراد بواسطة ${CURRENT_USER} — ${summary} (سُجّلت العملية في سجل التدقيق).`,
    });
  }



  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      Object.values(it).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [items, query]);

  function openCreate() {
    setEditingId(null);
    setDraft({ ...emptyRow(fields), [idKey]: nextId(items, idKey, idPrefix) });
    setError(null);
    setOpen(true);
  }

  function openEdit(row: T) {
    setEditingId(String(row[idKey]));
    setDraft({ ...row });
    setError(null);
    setOpen(true);
  }

  function save() {
    for (const f of fields) {
      if (f.required && !String(draft[f.key] ?? "").trim()) {
        setError(`الحقل «${f.label}» مطلوب`);
        return;
      }
    }
    const value = draft as T;
    if (editingId) update(editingId, value);
    else {
      if (items.some((it) => String(it[idKey]) === String(value[idKey]))) {
        setError("المعرّف مستخدم بالفعل");
        return;
      }
      create(value);
    }
    setOpen(false);
  }

  function renderCell(f: Field, row: T) {
    const v = row[f.key];
    if (f.type === "status") return <StatusPill value={String(v)} />;
    if (f.type === "mono")
      return <span className="font-mono text-xs text-muted-foreground">{String(v)}</span>;
    if (f.type === "progress")
      return (
        <div className="flex w-28 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, Number(v) || 0))}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{Number(v) || 0}%</span>
        </div>
      );
    return <span>{String(v ?? "—")}</span>;
  }

  return (
    <Panel
      title={title}
      {...(subtitle ? { subtitle } : {})}
      className={className}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadTemplate(`قالب-${title}`, fields, items[0])}
            title="تحميل قالب Excel جاهز"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
          >
            <Download className="size-3.5" /> قالب Excel
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            title="استيراد سجلات من ملف Excel"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
          >
            <Upload className="size-3.5" /> استيراد
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImport(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={reset}
            title="استعادة البيانات الافتراضية"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
          >
            <RotateCcw className="size-3.5" /> استعادة
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-3.5" /> {addLabel}
          </button>
        </div>
      }
    >
      {importMsg ? (
        <div
          className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
            importMsg.ok
              ? "border-primary/30 bg-primary/10 text-primary-ink"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {importMsg.text}
        </div>
      ) : null}

      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-background pr-9 pl-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
          placeholder="بحث…"
        />
      </div>


      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-right text-sm">
          <thead>
            <tr className="border-b border-border">
              {fields.map((f) => (
                <th
                  key={f.key}
                  className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-muted-foreground"
                >
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={String(row[idKey])}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/60"
              >
                {fields.map((f) => (
                  <td key={f.key} className="whitespace-nowrap px-3 py-3 text-foreground">
                    {renderCell(f, row)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(row)}
                      aria-label="تعديل"
                      className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("هل تريد حذف هذا السجل؟")) remove(String(row[idKey]));
                      }}
                      aria-label="حذف"
                      className="rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={fields.length + 1}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  لا توجد سجلات مطابقة.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="my-8 w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-card-foreground">
                {editingId ? "تعديل سجل" : addLabel}
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {fields
                .filter((f) => !f.hideInForm)
                .map((f) => (
                  <label key={f.key} className="block text-sm">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      {f.label}
                      {f.required ? " *" : ""}
                    </span>
                    {f.type === "select" || f.type === "status" ? (
                      <select
                        value={String(draft[f.key] ?? "")}
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                      >
                        <option value="">—</option>
                        {(f.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          f.type === "number" || f.type === "progress"
                            ? "number"
                            : f.type === "date"
                              ? "date"
                              : "text"
                        }
                        value={String(draft[f.key] ?? "")}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            [f.key]:
                              f.type === "number" || f.type === "progress"
                                ? Number(e.target.value)
                                : e.target.value,
                          })
                        }
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    )}
                  </label>
                ))}
            </div>

            {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
              >
                إلغاء
              </button>
              <button
                onClick={save}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
