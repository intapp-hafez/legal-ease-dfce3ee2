import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, FileSpreadsheet, X } from "lucide-react";
import type { Row } from "@/lib/crud";
import { nextId } from "@/lib/crud";
import { guessMapping, mapRows, readSheet, type SheetData } from "@/lib/excel";

export type ImportField = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  required?: boolean;
};

export type ImportResult = { added: number; updated: number; skipped: number; failed: number };

type Props<T extends Row> = {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: ImportField[];
  items: T[];
  idKey: string;
  idPrefix: string;
  onApply: (next: T[], result: ImportResult) => void;
};

type Policy = "replace" | "skip" | "manual";

type Plan = {
  adds: Row[];
  updates: { id: string; incoming: Row; existing: Row }[];
  failed: { rowIndex: number; reason: string }[];
};

export function ImportWizard<T extends Row>({
  open,
  onClose,
  title,
  fields,
  items,
  idKey,
  idPrefix,
  onApply,
}: Props<T>) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [policy, setPolicy] = useState<Policy>("replace");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setSheet(null);
      setFileName("");
      setMapping({});
      setPicked({});
      setError(null);
      setPolicy("replace");
    }
  }, [open]);

  async function pickFile(file: File) {
    setError(null);
    try {
      const data = await readSheet(file);
      if (!data.headers.length || !data.rows.length) {
        setError("الملف لا يحتوي على صفوف بيانات صالحة.");
        return;
      }
      setFileName(file.name);
      setSheet(data);
      setMapping(guessMapping(data.headers, fields));
      setStep(1);
    } catch {
      setError("تعذّر قراءة الملف. تأكد أنه بصيغة Excel أو CSV.");
    }
  }

  const mappedKeys = useMemo(() => Object.values(mapping).filter(Boolean), [mapping]);

  const plan = useMemo<Plan>(() => {
    if (!sheet) return { adds: [], updates: [], failed: [] };
    const rows = mapRows(sheet, mapping, fields);
    const adds: Row[] = [];
    const updates: Plan["updates"] = [];
    const failed: Plan["failed"] = [];
    const existingIds = new Set(items.map((it) => String(it[idKey])));
    const seen = new Set<string>();

    rows.forEach((r, i) => {
      const missing = fields.find(
        (f) => f.required && f.key !== idKey && !String(r[f.key] ?? "").trim(),
      );
      if (missing) {
        failed.push({ rowIndex: i + 2, reason: `الحقل «${missing.label}» مطلوب` });
        return;
      }
      const id = String(r[idKey] ?? "").trim();
      if (id && seen.has(id)) {
        failed.push({ rowIndex: i + 2, reason: `المعرّف «${id}» مكرر داخل الملف` });
        return;
      }
      if (id) seen.add(id);
      if (id && existingIds.has(id)) {
        const existing = items.find((it) => String(it[idKey]) === id) as Row;
        updates.push({ id, incoming: r, existing });
      } else {
        adds.push(r);
      }
    });
    return { adds, updates, failed };
  }, [sheet, mapping, fields, items, idKey]);

  useEffect(() => {
    if (step !== 2) return;
    const init: Record<string, boolean> = {};
    for (const u of plan.updates) init[u.id] = policy !== "skip";
    setPicked(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, policy]);

  const acceptedUpdates = plan.updates.filter((u) => (policy === "manual" ? picked[u.id] : policy === "replace"));
  const skippedCount = plan.updates.length - acceptedUpdates.length;

  function diffFields(u: Plan["updates"][number]) {
    return fields.filter(
      (f) =>
        mappedKeys.includes(f.key) &&
        f.key !== idKey &&
        String(u.incoming[f.key] ?? "") !== String(u.existing[f.key] ?? ""),
    );
  }

  function apply() {
    const next = [...items];
    for (const u of acceptedUpdates) {
      const idx = next.findIndex((it) => String(it[idKey]) === u.id);
      if (idx >= 0) next[idx] = { ...next[idx], ...u.incoming } as T;
    }
    for (const a of plan.adds) {
      const merged = { ...a } as T;
      if (!String(merged[idKey] ?? "").trim())
        (merged as Row)[idKey] = nextId(next as Row[], idKey, idPrefix);
      next.unshift(merged);
    }
    onApply(next, {
      added: plan.adds.length,
      updated: acceptedUpdates.length,
      skipped: skippedCount,
      failed: plan.failed.length,
    });
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-3xl rounded-xl border border-border bg-card p-5 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-card-foreground">
              استيراد من Excel — {title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {["اختيار الملف", "مطابقة الأعمدة", "المعاينة والتأكيد"][step]}
              {fileName ? ` • ${fileName}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>

        <ol className="mb-5 flex items-center gap-2 text-xs">
          {["1. الملف", "2. مطابقة الأعمدة", "3. المعاينة"].map((s, i) => (
            <li
              key={s}
              className={`rounded-lg border px-3 py-1.5 ${
                i === step
                  ? "border-primary bg-primary/10 font-medium text-primary-ink"
                  : "border-border text-muted-foreground"
              }`}
            >
              {s}
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <FileSpreadsheet className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="mb-4 text-sm text-muted-foreground">
              اختر ملف Excel أو CSV يحتوي على صف عناوين في الأعلى.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              اختيار ملف
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickFile(f);
                e.target.value = "";
              }}
            />
          </div>
        ) : null}

        {step === 1 && sheet ? (
          <div>
            <p className="mb-3 text-xs text-muted-foreground">
              طابق كل عمود في الملف مع الحقل المقابل في النظام. اترك «تجاهل» للأعمدة غير المطلوبة.
            </p>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-right text-sm">
                <thead className="sticky top-0 bg-secondary">
                  <tr>
                    <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                      عمود الملف
                    </th>
                    <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                      حقل النظام
                    </th>
                    <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                      قيمة أول صف
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sheet.headers.map((h) => (
                    <tr key={h} className="border-t border-border/60">
                      <td className="px-3 py-2 font-medium">{h}</td>
                      <td className="px-3 py-2">
                        <select
                          value={mapping[h] ?? ""}
                          onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}
                          className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        >
                          <option value="">— تجاهل —</option>
                          {fields.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {sheet.rows[0]?.[h] || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!mappedKeys.includes(idKey) ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-warning-ink">
                <AlertTriangle className="size-3.5" /> لم يتم ربط حقل المعرّف — ستُضاف كل الصفوف
                كسجلات جديدة.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 2 && sheet ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "صفوف الملف", value: sheet.rows.length, tone: "text-foreground" },
                { label: "ستُضاف", value: plan.adds.length, tone: "text-primary-ink" },
                { label: "ستُحدَّث", value: acceptedUpdates.length, tone: "text-primary-ink" },
                {
                  label: "ستُتخطى / فشلت",
                  value: skippedCount + plan.failed.length,
                  tone: "text-destructive",
                },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={`font-display text-xl font-bold ${c.tone}`}>{c.value}</p>
                </div>
              ))}
            </div>

            {plan.updates.length ? (
              <div className="rounded-lg border border-border p-3">
                <p className="mb-2 text-xs font-semibold text-foreground">
                  تعارضات التحديث ({plan.updates.length}) — كيف نتعامل مع السجلات الموجودة؟
                </p>
                <div className="mb-3 flex flex-wrap gap-3 text-xs">
                  {(
                    [
                      ["replace", "استبدال البيانات الحالية"],
                      ["skip", "تخطي السجلات المتعارضة"],
                      ["manual", "تحديد يدوي لكل سجل"],
                    ] as [Policy, string][]
                  ).map(([v, label]) => (
                    <label key={v} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="policy"
                        checked={policy === v}
                        onChange={() => setPolicy(v)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border/60">
                  <table className="w-full text-right text-xs">
                    <tbody>
                      {plan.updates.map((u) => (
                        <tr key={u.id} className="border-b border-border/60 last:border-0">
                          <td className="w-10 px-2 py-2">
                            <input
                              type="checkbox"
                              disabled={policy !== "manual"}
                              checked={policy === "manual" ? !!picked[u.id] : policy === "replace"}
                              onChange={(e) => setPicked({ ...picked, [u.id]: e.target.checked })}
                            />
                          </td>
                          <td className="px-2 py-2 font-mono">{u.id}</td>
                          <td className="px-2 py-2 text-muted-foreground">
                            {diffFields(u).length
                              ? diffFields(u)
                                  .map(
                                    (f) =>
                                      `${f.label}: ${u.existing[f.key] || "—"} ← ${u.incoming[f.key] || "—"}`,
                                  )
                                  .join(" | ")
                              : "لا اختلاف في القيم"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {plan.failed.length ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                <p className="mb-1 font-semibold">صفوف لن تُستورد ({plan.failed.length})</p>
                <ul className="space-y-0.5">
                  {plan.failed.slice(0, 8).map((f) => (
                    <li key={f.rowIndex}>
                      الصف {f.rowIndex}: {f.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary"
          >
            <ArrowRight className="size-3.5" /> {step === 0 ? "إلغاء" : "السابق"}
          </button>
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!mappedKeys.length}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              معاينة النتائج <ArrowLeft className="size-3.5" />
            </button>
          ) : null}
          {step === 2 ? (
            <button
              onClick={apply}
              disabled={!plan.adds.length && !acceptedUpdates.length}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Check className="size-3.5" /> تنفيذ الاستيراد
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
