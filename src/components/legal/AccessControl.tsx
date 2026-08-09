import { useState } from "react";
import { Pencil, Plus, Trash2, X, RotateCcw } from "lucide-react";
import { Panel } from "@/components/legal/PageShell";
import {
  MODULES,
  ROLES,
  roleLabel,
  useAuth,
  type ModuleId,
  type RoleId,
  type User,
} from "@/lib/auth";

const emptyUser = (): User => ({
  id: `U-${Date.now().toString().slice(-5)}`,
  name: "",
  username: "",
  password: "1234",
  role: "employee",
  active: true,
});

export function AccessControl() {
  const { users, matrix, saveUser, removeUser, setPerm, resetAccess, user } = useAuth();
  const canManage = user?.role === "super_admin";
  const [draft, setDraft] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.username.trim() || !draft.password.trim()) {
      setError("الاسم واسم المستخدم وكلمة المرور مطلوبة");
      return;
    }
    const dup = users.some(
      (u) => u.id !== draft.id && u.username.toLowerCase() === draft.username.trim().toLowerCase(),
    );
    if (dup) {
      setError("اسم المستخدم مستخدم بالفعل");
      return;
    }
    saveUser({ ...draft, username: draft.username.trim(), name: draft.name.trim() });
    setDraft(null);
    setError(null);
  }

  return (
    <div className="space-y-5">
      <Panel
        title="المستخدمون والأدوار"
        subtitle="إدارة حسابات الدخول وتعيين الدور لكل مستخدم"
        action={
          canManage ? (
            <button
              onClick={() => {
                setDraft(emptyUser());
                setError(null);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-3.5" />
              مستخدم جديد
            </button>
          ) : null
        }
      >
        {!canManage ? (
          <p className="mb-3 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
            العرض فقط — إدارة المستخدمين والصلاحيات متاحة لدور «مدير عام (Super Admin)».
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">الاسم</th>
                <th className="px-3 py-2 font-medium">اسم المستخدم</th>
                <th className="px-3 py-2 font-medium">الدور</th>
                <th className="px-3 py-2 font-medium">الحالة</th>
                {canManage ? <th className="px-3 py-2 font-medium">إجراءات</th> : null}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/70 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-foreground">{u.name}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{u.username}</td>
                  <td className="px-3 py-2.5 text-xs">{roleLabel(u.role)}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        u.active
                          ? "bg-accent/15 text-[var(--accent-ink)]"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {u.active ? "نشط" : "موقوف"}
                    </span>
                  </td>
                  {canManage ? (
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <button
                          aria-label={`تعديل ${u.name}`}
                          onClick={() => {
                            setDraft({ ...u });
                            setError(null);
                          }}
                          className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          aria-label={`حذف ${u.name}`}
                          disabled={u.id === user?.id}
                          onClick={() => removeUser(u.id)}
                          className="rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="مصفوفة الصلاحيات حسب الدور"
        subtitle="تحديد صلاحية العرض والتعديل لكل وحدة"
        action={
          canManage ? (
            <button
              onClick={resetAccess}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
            >
              <RotateCcw className="size-3.5" />
              استعادة الافتراضي
            </button>
          ) : null
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">الوحدة</th>
                {ROLES.map((r) => (
                  <th key={r.id} className="px-3 py-2 font-medium">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m.id} className="border-b border-border/70 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-foreground">{m.label}</td>
                  {ROLES.map((r) => (
                    <td key={r.id} className="px-3 py-2.5">
                      <PermCell
                        role={r.id}
                        module={m.id}
                        view={matrix[r.id]?.[m.id]?.view ?? false}
                        edit={matrix[r.id]?.[m.id]?.edit ?? false}
                        disabled={!canManage || r.id === "super_admin"}
                        onChange={setPerm}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-card-foreground">بيانات المستخدم</h3>
              <button
                aria-label="إغلاق"
                onClick={() => setDraft(null)}
                className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="الاسم">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </Field>
              <Field label="اسم المستخدم">
                <input
                  value={draft.username}
                  onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </Field>
              <Field label="كلمة المرور">
                <input
                  value={draft.password}
                  onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </Field>
              <Field label="الدور">
                <select
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value as RoleId })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                />
                حساب نشط
              </label>

              {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDraft(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
              >
                إلغاء
              </button>
              <button
                onClick={submit}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function PermCell({
  role,
  module,
  view,
  edit,
  disabled,
  onChange,
}: {
  role: RoleId;
  module: ModuleId;
  view: boolean;
  edit: boolean;
  disabled: boolean;
  onChange: (role: RoleId, module: ModuleId, perm: { view: boolean; edit: boolean }) => void;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={view}
          disabled={disabled}
          onChange={(e) => onChange(role, module, { view: e.target.checked, edit: e.target.checked ? edit : false })}
        />
        عرض
      </label>
      <label className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={edit}
          disabled={disabled}
          onChange={(e) => onChange(role, module, { view: e.target.checked ? true : view, edit: e.target.checked })}
        />
        تعديل
      </label>
    </div>
  );
}
