import { useState } from "react";
import {
  ArrowUpDown,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
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

function normalizeArabicSearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ar")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/(^|\s)ال/g, "$1")
    .replace(/[ً-ْ]/g, "");
}

export function AccessControl() {
  const { users, matrix, saveUser, removeUser, setPerm, resetAccess, user } = useAuth();
  const canManage = user?.role === "super_admin";
  const [draft, setDraft] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleId>("admin");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [permissionSort, setPermissionSort] = useState<"default" | "name" | "enabled" | "disabled">("default");

  const normalizedPermissionSearch = normalizeArabicSearch(permissionSearch);
  const visibleModules = MODULES.filter((module) =>
    normalizeArabicSearch(module.label).includes(normalizedPermissionSearch),
  ).sort((a, b) => {
    if (permissionSort === "name") return a.label.localeCompare(b.label, "ar");
    if (permissionSort === "enabled" || permissionSort === "disabled") {
      const aEnabled = matrix[selectedRole]?.[a.id]?.view || matrix[selectedRole]?.[a.id]?.edit ? 1 : 0;
      const bEnabled = matrix[selectedRole]?.[b.id]?.view || matrix[selectedRole]?.[b.id]?.edit ? 1 : 0;
      return permissionSort === "enabled" ? bEnabled - aEnabled : aEnabled - bEnabled;
    }
    return MODULES.indexOf(a) - MODULES.indexOf(b);
  });

  const enabledCount = MODULES.filter(
    (module) => matrix[selectedRole]?.[module.id]?.view || matrix[selectedRole]?.[module.id]?.edit,
  ).length;

  function updateVisiblePermissions(mode: "view" | "edit" | "off") {
    if (!canManage || selectedRole === "super_admin") return;
    visibleModules.forEach((module) => {
      setPerm(selectedRole, module.id, {
        view: mode !== "off",
        edit: mode === "edit",
      });
    });
  }

  function submit() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.username.trim()) {
      setError("الاسم واسم المستخدم مطلوبان");
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
          <div className="flex h-10 items-center justify-between rounded-lg border border-border bg-secondary/30 px-3">
            <span className="text-xs font-semibold">مستخدمي النظام ({users.length})</span>
          </div>
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
                <tr key={u.id} className="group border-b border-border/70 last:border-0">
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
                          className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          title="لا يمكن الحذف من الواجهة"
                        >
                          <Trash2 className="size-4" />
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
        title="محرر مصفوفة الصلاحيات"
        subtitle="ابحث عن الوحدة ثم فعّل الوصول أو امنح صلاحية التعديل للدور المحدد"
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
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-2 border-b border-border pb-5 lg:border-b-0 lg:border-l lg:pb-0 lg:pl-5">
            <p className="mb-3 text-xs font-semibold text-muted-foreground">اختر الدور</p>
            {ROLES.map((role) => {
              const active = selectedRole === role.id;
              const roleEnabled = MODULES.filter(
                (module) => matrix[role.id]?.[module.id]?.view || matrix[role.id]?.[module.id]?.edit,
              ).length;
              return (
                <button
                  key={role.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-right transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-[var(--primary-ink)]"
                      : "border-transparent text-foreground hover:border-border hover:bg-secondary"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">{role.label}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {roleEnabled} من {MODULES.length} وحدات
                    </span>
                  </span>
                  {active ? <Check className="size-4 shrink-0" /> : null}
                </button>
              );
            })}
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-[var(--primary-ink)]" />
                  <h3 className="text-sm font-bold text-foreground">{roleLabel(selectedRole)}</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  الوصول مفعّل إلى {enabledCount} من أصل {MODULES.length} وحدات
                </p>
              </div>
              {selectedRole === "super_admin" ? (
                <span className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                  صلاحيات ثابتة كاملة
                </span>
              ) : null}
            </div>

            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">بحث في الوحدات</span>
                <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={permissionSearch}
                  onChange={(event) => setPermissionSearch(event.target.value)}
                  placeholder="ابحث باسم الوحدة..."
                  className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="relative sm:w-52">
                <span className="sr-only">ترتيب الصلاحيات</span>
                <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={permissionSort}
                  onChange={(event) => setPermissionSort(event.target.value as typeof permissionSort)}
                  className="h-10 w-full appearance-none rounded-lg border border-input bg-background pr-9 pl-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="default">الترتيب الافتراضي</option>
                  <option value="name">حسب اسم الوحدة</option>
                  <option value="enabled">المفعّلة أولًا</option>
                  <option value="disabled">المعطّلة أولًا</option>
                </select>
              </label>
            </div>

            {canManage && selectedRole !== "super_admin" ? (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/50 p-2">
                <span className="px-1 text-xs text-muted-foreground">تطبيق على النتائج ({visibleModules.length}):</span>
                <button type="button" onClick={() => updateVisiblePermissions("view")} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/10">
                  تفعيل العرض
                </button>
                <button type="button" onClick={() => updateVisiblePermissions("edit")} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/10">
                  تفعيل العرض والتعديل
                </button>
                <button type="button" onClick={() => updateVisiblePermissions("off")} className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
                  تعطيل الوصول
                </button>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[minmax(0,1fr)_92px_92px] border-b border-border bg-secondary/70 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <span>الوحدة</span>
                <span className="text-center">الوصول</span>
                <span className="text-center">التعديل</span>
              </div>
              {visibleModules.length ? (
                visibleModules.map((module) => {
                  const permission = matrix[selectedRole]?.[module.id] ?? { view: false, edit: false };
                  return (
                    <PermissionRow
                      key={module.id}
                      label={module.label}
                      role={selectedRole}
                      module={module.id}
                      view={permission.view}
                      edit={permission.edit}
                      disabled={!canManage || selectedRole === "super_admin"}
                      onChange={setPerm}
                    />
                  );
                })
              ) : (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">لا توجد وحدة مطابقة للبحث.</div>
              )}
            </div>
          </div>
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
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-foreground">كلمة المرور (مخفية)</span>
                    <input
                      type="password"
                      value="********"
                      disabled
                      className="h-9 w-full rounded-md border border-border bg-secondary/50 px-3 text-sm text-muted-foreground outline-none"
                    />
                  </label>
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

function PermissionRow({
  label,
  role,
  module,
  view,
  edit,
  disabled,
  onChange,
}: {
  label: string;
  role: RoleId;
  module: ModuleId;
  view: boolean;
  edit: boolean;
  disabled: boolean;
  onChange: (role: RoleId, module: ModuleId, perm: { view: boolean; edit: boolean }) => void;
}) {
  return (
    <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_92px_92px] items-center border-b border-border/70 px-3 last:border-0 hover:bg-secondary/40">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${view || edit ? "bg-primary/12 text-[var(--primary-ink)]" : "bg-secondary text-muted-foreground"}`}>
          {view || edit ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{view || edit ? (edit ? "عرض وتعديل" : "عرض فقط") : "لا يوجد وصول"}</p>
        </div>
      </div>
      <div className="flex justify-center">
        <PermissionSwitch
          label={`الوصول إلى ${label}`}
          checked={view || edit}
          disabled={disabled}
          onChange={(checked) => onChange(role, module, { view: checked, edit: checked ? edit : false })}
        />
      </div>
      <div className="flex justify-center">
        <PermissionSwitch
          label={`تعديل ${label}`}
          checked={edit}
          disabled={disabled}
          onChange={(checked) => onChange(role, module, { view: checked ? true : view, edit: checked })}
        />
      </div>
    </div>
  );
}

function PermissionSwitch({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "border-primary bg-primary" : "border-border bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 size-4.5 rounded-full bg-card shadow-sm transition-[right] ${checked ? "right-5" : "right-0.5"}`}
      />
    </button>
  );
}
