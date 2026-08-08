import { Check, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { Panel } from "@/components/legal/PageShell";
import { useDocumentCategories } from "@/lib/document-categories";
import { useState } from "react";

function OptionManager({
  title,
  api,
  placeholder,
}: {
  title: string;
  api: {
    options: string[];
    add: (value: string) => string | null;
    rename: (oldValue: string, next: string) => string | null;
    remove: (value: string) => void;
    reset: () => void;
  };
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const submit = () => {
    const err = api.add(draft);
    setError(err);
    if (!err) setDraft("");
  };

  const saveEdit = (original: string) => {
    const err = api.rename(original, editValue);
    setEditError(err);
    if (!err) setEditing(null);
  };

  return (
    <Panel
      title={title}
      action={
        <button
          type="button"
          onClick={() => api.reset()}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none hover:bg-muted focus:ring-2 focus:ring-ring/40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          استعادة الافتراضي
        </button>
      }
    >
      <div className="space-y-3">
        <div>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={placeholder}
              aria-invalid={!!error}
              className={`h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 ${
                error ? "border-destructive" : "border-border"
              }`}
            />
            <button
              type="button"
              onClick={submit}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm text-[var(--primary-ink)] outline-none hover:opacity-90 focus:ring-2 focus:ring-ring/40"
            >
              <Plus className="h-4 w-4" />
              إضافة
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <ul className="divide-y divide-border rounded-lg border border-border">
          {api.options.map((o) => (
            <li key={o} className="flex items-center gap-2 px-3 py-2 text-sm">
              {editing === o ? (
                <>
                  <div className="flex-1">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => {
                        setEditValue(e.target.value);
                        setEditError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveEdit(o);
                        }
                        if (e.key === "Escape") setEditing(null);
                      }}
                      className={`h-9 w-full rounded-lg border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 ${
                        editError ? "border-destructive" : "border-border"
                      }`}
                    />
                    {editError && (
                      <p role="alert" className="mt-1 text-xs font-medium text-destructive">
                        {editError}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="حفظ"
                    onClick={() => saveEdit(o)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="إلغاء"
                    onClick={() => setEditing(null)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">{o}</span>
                  <button
                    type="button"
                    aria-label={`تعديل ${o}`}
                    onClick={() => {
                      setEditing(o);
                      setEditValue(o);
                      setEditError(null);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`حذف ${o}`}
                    onClick={() => api.remove(o)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          ))}
          {api.options.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground">لا توجد خيارات</li>
          )}
        </ul>
      </div>
    </Panel>
  );
}

export function DocumentCategoriesSettings() {
  const categories = useDocumentCategories();
  return (
    <OptionManager
      title="تصنيفات المستندات"
      api={categories}
      placeholder="اسم تصنيف جديد (مثال: تصريح زكاة)"
    />
  );
}
