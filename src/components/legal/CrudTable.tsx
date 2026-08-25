import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, Eye, FileText, Pencil, Plus, RotateCcw, Search, Trash2, Upload, X } from "lucide-react";
import { Panel, StatusPill } from "@/components/legal/PageShell";
import { ImportWizard, type ImportResult } from "@/components/legal/ImportWizard";
import { SearchSelect } from "@/components/legal/SearchSelect";
import { useCollection, nextId, type Row } from "@/lib/crud";
import { useSupabaseCollection } from "@/lib/useSupabase";
import { downloadTemplate } from "@/lib/excel";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth";
import { EmployeeCell } from "@/components/legal/EmployeeCell";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/date-utils";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "status" | "progress" | "mono" | "textarea" | "file";
  options?: (string | { value: string; label: string })[];
  required?: boolean;
  hideInForm?: boolean;
  hideInTable?: boolean;
  /** If provided, renders a searchable select with a + button to add new options. */
  onAddOption?: (value: string) => string | null | void;
  addLabel?: string;
  accept?: string;
  render?: (value: any, row: any) => ReactNode;
};

type Props<T extends Row> = {
  title: string;
  storageKey: string;
  seed: T[];
  idKey: string;
  sequenceKey?: string;
  idPrefix: string;
  fields: Field[];
  className?: string;
  addLabel?: string;
  subtitle?: string;
  extraActions?: ReactNode;
  /** Pass this prop to connect directly to a Supabase table instead of local storage! */
  tableName?: string;
  /** Optional external filters, e.g. { category: "رخصة استيراد" }. Empty values are ignored. */
  filters?: Record<string, string>;
  onRowClick?: (row: T) => void;
  /** Number of rows per page (default: 12) */
  pageSize?: number;
};

function breakEveryWords(text: string | null | undefined, wordsPerLine = 2): string {
  if (!text || typeof text !== "string") return String(text ?? "—");
  const words = text.trim().split(/\s+/);
  if (words.length <= wordsPerLine) return text;
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(" "));
  }
  return lines.join("\n");
}

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
  sequenceKey,
  idPrefix,
  fields,
  className = "",
  addLabel = "إضافة",
  subtitle,
  filters,
  extraActions,
  tableName,
  onRowClick,
  pageSize = 12,
}: Props<T>) {
  const { user } = useAuth();

  const localDb = useCollection<T>(storageKey, seed, idKey);
  const supabaseDb = useSupabaseCollection<T>(tableName || "", idKey as keyof T);
  const db = tableName ? supabaseDb : localDb;
  
  const { items, create, update, remove, reset, replaceAll, hydrated } = db;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Row>(() => emptyRow(fields));
  const [fileUploads, setFileUploads] = useState<Record<string, File[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [previewData, setPreviewData] = useState<{ name: string; url: string | null; isPlaceholder?: boolean; row?: any } | null>(null);

  async function handleOpenFilePreview(row: any, fieldKey: string) {
    const fileName = String(row[fieldKey] || row.attachment || "");
    if (!fileName || fileName === "—") return;

    let url = (row as any).file_url || null;
    let repoDoc: any = null;

    // 1. Search the repository table
    if (!url) {
      try {
        // A. Search by exact name
        const { data: exactMatches } = await supabase
          .from("repository")
          .select("id, name, file_url, parent_id")
          .eq("name", fileName)
          .limit(1);

        if (exactMatches && exactMatches.length > 0) {
          repoDoc = exactMatches[0];
          if (repoDoc.file_url) url = repoDoc.file_url;
        }

        // B. Search by UUID if fileName is a valid UUID
        if (!repoDoc && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileName)) {
          const { data: idMatches } = await supabase
            .from("repository")
            .select("id, name, file_url, parent_id")
            .eq("id", fileName)
            .limit(1);
          if (idMatches && idMatches.length > 0) {
            repoDoc = idMatches[0];
            if (repoDoc.file_url) url = repoDoc.file_url;
          }
        }

        // C. Search by ILIKE if still not found
        if (!repoDoc) {
          const { data: fuzzyMatches } = await supabase
            .from("repository")
            .select("id, name, file_url, parent_id")
            .ilike("name", `%${fileName.trim()}%`)
            .limit(1);
          if (fuzzyMatches && fuzzyMatches.length > 0) {
            repoDoc = fuzzyMatches[0];
            if (repoDoc.file_url) url = repoDoc.file_url;
          }
        }
      } catch (err) {
        console.warn("Error fetching repository file:", err);
      }
    }

    // 2. If URL is still not found, check Supabase Storage legal_documents
    if (!url) {
      try {
        const foldersToSearch = ["uploads", "root", repoDoc?.parent_id, row.repository_folder_id].filter(Boolean);
        for (const fld of foldersToSearch) {
          const { data: filesInBucket } = await supabase.storage.from("legal_documents").list(String(fld), {
            search: fileName,
          });
          if (filesInBucket && filesInBucket.length > 0) {
            const match = filesInBucket.find((f) => f.name.includes(fileName) || fileName.includes(f.name));
            if (match) {
              const { data: pUrl } = supabase.storage.from("legal_documents").getPublicUrl(`${fld}/${match.name}`);
              if (pUrl?.publicUrl) {
                url = pUrl.publicUrl;
                if (repoDoc?.id) {
                  supabase.from("repository").update({ file_url: url }).eq("id", repoDoc.id);
                }
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error searching storage bucket:", err);
      }
    }

    // 3. Check if local documents folder has it
    if (!url) {
      try {
        const testLocalUrl = `/documents/${encodeURIComponent(fileName)}`;
        const res = await fetch(testLocalUrl, { method: "HEAD" });
        if (res.ok) {
          url = testLocalUrl;
        }
      } catch {}
    }

    setPreviewData({
      name: fileName,
      url: url,
      isPlaceholder: !url,
      row,
    });
  }

  useEffect(() => {
    setPage(1);
  }, [query, filters]);

  useEffect(() => {
    if (pageSize) {
      setPageSizeState(pageSize);
    }
  }, [pageSize]);

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
      text: `تم الاستيراد بواسطة ${user?.name || "المستخدم"} — ${summary} (سُجّلت العملية في سجل التدقيق).`,
    });
  }

  const filtered = useMemo(() => {
    const active = Object.entries(filters ?? {}).filter(([, v]) => v);
    let list = items;
    if (active.length)
      list = list.filter((it) => active.every(([k, v]) => String(it[k] ?? "") === v));
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) =>
      Object.values(it).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [items, query, filters]);

  const visibleFields = useMemo(() => fields.filter((f) => !f.hideInTable), [fields]);

  const totalRows = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSizeState));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSizeState;
  const endIndex = Math.min(startIndex + pageSizeState, totalRows);

  const paginatedRows = useMemo(() => {
    return filtered.slice(startIndex, endIndex);
  }, [filtered, startIndex, endIndex]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };


  function openCreate() {
    setEditingId(null);
    const seq = sequenceKey || idKey;
    const initial = emptyRow(fields);
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null && v !== "") {
          initial[k] = v;
        }
      }
    }
    setDraft({ ...initial, [seq]: nextId(items, seq, idPrefix) });
    setFileUploads({});
    setError(null);
    setOpen(true);
  }

  function openEdit(row: T) {
    setEditingId(String(row[idKey]));
    setDraft({ ...row });
    setFileUploads({});
    setError(null);
    setOpen(true);
  }

  async function save() {
    for (const f of fields) {
      if (f.required && !String(draft[f.key] ?? "").trim()) {
        setError(`الحقل «${f.label}» مطلوب`);
        return;
      }
    }
    
    setSaving(true);
    setError(null);
    const value = { ...(filters || {}), ...draft } as T;

    try {
      // Upload any files
      for (const [key, files] of Object.entries(fileUploads)) {
        if (files && files.length > 0) {
          const file = files[0];
          if (!file) continue;
          const path = `uploads/${Date.now()}_${file.name}`;
          const { data, error } = await supabase.storage.from("legal_documents").upload(path, file);
          if (!error && data) {
            const { data: publicUrlData } = supabase.storage.from("legal_documents").getPublicUrl(path);
            (value as any).file_url = publicUrlData.publicUrl;
          }
        }
      }

      if (editingId) update(editingId, value);
      else {
        if (items.some((it) => String(it[idKey]) === String(value[idKey]))) {
          setError("المعرّف مستخدم بالفعل");
          setSaving(false);
          return;
        }
        if (tableName && idKey === "id") {
          delete (value as any).id;
        }
        create(value);
      }
      setOpen(false);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  function renderCell(f: Field, row: T) {
    const v = row[f.key];
    if (f.render) return f.render(v, row);
    if (f.type === "status") return <StatusPill value={String(v)} />;
    if (f.type === "date" || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))) {
      return <span className="font-mono text-xs text-foreground">{formatDate(v as string)}</span>;
    }
    if (f.type === "mono" && f.key !== "employee_id" && f.key !== "assignee_id" && f.key !== "created_by")
      return <span className="font-mono text-xs text-muted-foreground">{String(v)}</span>;
    if (f.type === "select" && Array.isArray(f.options)) {
      const option = f.options.find((o) => typeof o === "object" && (o.value === String(v) || o.value?.toLowerCase() === String(v)?.toLowerCase()));
      if (option && typeof option === "object") {
        const lbl = String(option.label ?? "");
        if (lbl.trim().split(/\s+/).length > 2) {
          return (
            <div className="whitespace-pre-line text-sm leading-relaxed" dir="rtl">
              {breakEveryWords(lbl, 2)}
            </div>
          );
        }
        return <span>{lbl}</span>;
      }
    }
    if (f.type === "file" || f.key === "attachment" || f.key === "file" || f.key === "attachment_url") {
      const vStr = String(v ?? "").trim();
      if (!vStr || vStr === "—") return <span className="text-muted-foreground text-xs">—</span>;

      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenFilePreview(row, f.key);
          }}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 hover:underline transition-colors"
          title={`عرض ${vStr}`}
        >
          <Eye className="size-3.5 shrink-0" />
          <span>عرض</span>
        </button>
      );
    }
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

    const vStr = String(v ?? "").trim();
    const isIdField =
      f.key.endsWith("_id") ||
      f.key === "created_by" ||
      f.key === "owner" ||
      f.key === "lawyer" ||
      f.key === "assignee" ||
      f.key === "employee";
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vStr);

    if ((isIdField || isUuid) && vStr) {
      return <EmployeeCell employeeId={vStr} />;
    }

    if (
      f.type === "textarea" ||
      f.key === "description" ||
      f.key === "details" ||
      f.key === "decision" ||
      f.key === "notes" ||
      (typeof v === "string" && v.trim().split(/\s+/).length > 2 && !isUuid && !isIdField && f.type !== "mono")
    ) {
      return (
        <div className="whitespace-pre-line text-sm leading-relaxed" dir="rtl">
          {breakEveryWords(String(v), 2)}
        </div>
      );
    }

    return <span>{String(v ?? "—")}</span>;
  }

  return (
    <Panel
      title={title}
      {...(subtitle ? { subtitle } : {})}
      className={className}
      action={
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          <button
            onClick={() => downloadTemplate(`قالب-${title}`, fields as any, items[0])}
            title="تحميل قالب Excel جاهز"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
          >
            <Download className="size-3.5" /> قالب Excel
          </button>
          <button
            onClick={() => {
              setImportMsg(null);
              setWizardOpen(true);
            }}
            title="استيراد سجلات من ملف Excel"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
          >
            <Upload className="size-3.5" /> استيراد
          </button>

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
      <ImportWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title={title}
        fields={fields as any}
        items={items}
        idKey={sequenceKey || idKey}
        idPrefix={idPrefix}
        onApply={finishImport}
      />

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

      {!hydrated && (
        <div className="py-8 text-center text-sm text-muted-foreground">جاري تحميل البيانات...</div>
      )}

      {hydrated && (
        <>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-right text-sm">
          <thead>
            <tr className="border-b border-border">
              {visibleFields.map((f) => (
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
            {paginatedRows.map((row) => (
              <tr
                key={String(row[idKey])}
                className={`border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/60 ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={(e) => {
                  if (onRowClick && !(e.target as HTMLElement).closest("button") && !(e.target as HTMLElement).closest("a")) {
                    onRowClick(row);
                  }
                }}
              >
                {visibleFields.map((f) => (
                  <td
                    key={f.key}
                    className={`px-3 py-3 text-foreground ${
                      f.type === "textarea" ||
                      f.key === "description" ||
                      f.key === "details" ||
                      f.key === "decision" ||
                      f.key === "notes" ||
                      f.key === "name" ||
                      f.key === "repository_folder_id" ||
                      f.key === "authority"
                        ? "whitespace-normal min-w-[120px] max-w-[280px]"
                        : "whitespace-nowrap"
                    }`}
                  >
                    {renderCell(f, row)}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-3">
                  <div className="flex items-center gap-1.5">
                    {(() => {
                      const fileField = fields.find((f) => f.type === "file" && row[f.key]);
                      if (!fileField || !row[fileField.key]) return null;
                      
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFilePreview(row, fileField.key);
                          }}
                          aria-label="معاينة المرفق"
                          title="معاينة المرفق"
                          className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Eye className="size-3.5" />
                        </button>
                      );
                    })()}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(row);
                      }}
                      aria-label="تعديل"
                      className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
                  colSpan={visibleFields.length + 1}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  لا توجد سجلات مطابقة.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4 mt-3 text-sm" dir="rtl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              عرض <span className="font-semibold text-foreground">{startIndex + 1}</span>–<span className="font-semibold text-foreground">{endIndex}</span> من إجمالي <span className="font-semibold text-foreground">{totalRows}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Rows per page selector */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>لكل صفحة:</span>
              <select
                value={pageSizeState}
                onChange={(e) => {
                  setPageSizeState(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/40 cursor-pointer"
              >
                {[12, 24, 36, 48, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs text-foreground outline-none hover:bg-secondary disabled:pointer-events-none disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  السابق
                </button>

                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers().map((pNum, idx) =>
                    typeof pNum === "number" ? (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPage(pNum)}
                        className={`h-8 min-w-[2rem] rounded-md px-2 text-xs font-medium transition-colors ${
                          safePage === pNum
                            ? "bg-primary text-primary-foreground font-bold shadow-sm"
                            : "border border-border bg-background text-foreground hover:bg-secondary"
                        }`}
                      >
                        {pNum}
                      </button>
                    ) : (
                      <span key={idx} className="px-1 text-xs text-muted-foreground">
                        {pNum}
                      </span>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs text-foreground outline-none hover:bg-secondary disabled:pointer-events-none disabled:opacity-40 transition-colors"
                >
                  التالي
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}

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
                  <label key={f.key} className={`block text-sm ${f.type === "textarea" || f.type === "file" ? "sm:col-span-2" : ""}`}>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      {f.label}
                      {f.required ? " *" : ""}
                    </span>
                    {f.type === "select" || f.type === "status" ? (
                      f.onAddOption ? (
                        <SearchSelect
                          label={""}
                          value={(() => {
                             const current = String(draft[f.key] ?? "");
                             const opt = (f.options ?? []).find(o => typeof o === 'object' && o.value === current);
                             return opt ? (opt as any).label : current;
                          })()}
                          onChange={(label) => {
                             const opt = (f.options ?? []).find(o => (typeof o === 'string' ? o : o.label) === label);
                             setDraft({ ...draft, [f.key]: typeof opt === 'object' ? opt.value : label });
                          }}
                          options={(f.options ?? []).map(o => typeof o === "string" ? o : o.label)}
                          allLabel="—"
                          onAddOption={f.onAddOption}
                          addLabel={f.addLabel ?? "إضافة خيار جديد"}
                        />
                      ) : (
                        <select
                          value={String(draft[f.key] ?? "")}
                          onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        >
                          <option value="">—</option>
                          {(f.options ?? []).map((o) => {
                            const val = typeof o === "string" ? o : o.value;
                            const lbl = typeof o === "string" ? o : o.label;
                            return (
                              <option key={val} value={val}>
                                {lbl}
                              </option>
                            );
                          })}
                        </select>
                      )
                    ) : f.type === "textarea" ? (
                      <textarea
                        value={String(draft[f.key] ?? "")}
                        onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                        className="min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                      />
                    ) : f.type === "file" ? (
                      <div className="space-y-2">
                        {draft[f.key] ? (
                          <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="size-4 shrink-0 text-primary" />
                              <span className="truncate text-xs font-medium text-foreground" title={String(draft[f.key])}>
                                {String(draft[f.key])}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenFilePreview(draft, f.key)}
                                className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-primary hover:bg-secondary transition-colors"
                              >
                                <Eye className="size-3.5" />
                                معاينة
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedDraft = { ...draft };
                                  delete updatedDraft[f.key];
                                  delete (updatedDraft as any).file_url;
                                  setDraft(updatedDraft);
                                  const updatedUploads = { ...fileUploads };
                                  delete updatedUploads[f.key];
                                  setFileUploads(updatedUploads);
                                }}
                                title="حذف المرفق"
                                className="rounded-md border border-border bg-background p-1 text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <div>
                          <input
                            type="file"
                            accept={f.accept}
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setFileUploads({ ...fileUploads, [f.key]: files });
                              setDraft({ ...draft, [f.key]: files.map((file) => file.name).join("، ") });
                            }}
                            className="h-10 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none file:ml-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20 focus:ring-2 focus:ring-ring/40"
                          />
                          {f.accept && (
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                              الملفات المسموحة:{" "}
                              <span className="font-mono opacity-80" dir="ltr">
                                {f.accept.replace(/\./g, "").replace(/,/g, ", ")}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
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
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewData ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={() => setPreviewData(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-xl border border-border bg-card p-4 shadow-lg min-h-[50vh] max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h3 className="font-display text-base font-bold text-card-foreground">
                  معاينة المرفق: <span className="font-normal text-muted-foreground">{previewData.name}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {previewData.url && (
                  <a
                    href={previewData.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    aria-label="تحميل"
                    title="تحميل الملف"
                  >
                    <Download className="size-4" />
                  </a>
                )}
                <button
                  onClick={() => setPreviewData(null)}
                  className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-secondary/20 rounded-lg overflow-hidden relative flex flex-col items-center justify-center min-h-[350px]">
              {previewData.url ? (
                <iframe
                  src={previewData.url}
                  className="w-full h-full min-h-[500px] border-0 rounded-lg"
                  title={previewData.name}
                />
              ) : (
                <div className="p-8 text-center max-w-md space-y-4">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <FileText className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-foreground">{previewData.name}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      اسم الملف مسجل في النظام، ولكن لم يتم رفع الملف الرقمي الفعلي إلى مساحة التخزين السحابية بعد.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground text-right leading-relaxed">
                    💡 <strong className="text-foreground">لرفع الملف الفعلي:</strong> يمكنك تعديل السجل واختيار الملف من جهازك ليتم حفظه وربطه فوراً.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const rowToEdit = previewData.row || items.find(it => String(it["attachment"] || it["name"] || '') === previewData.name);
                      setPreviewData(null);
                      if (rowToEdit) {
                        openEdit(rowToEdit);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Upload className="size-3.5" />
                    رفع الملف لهذا السجل الآن
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
