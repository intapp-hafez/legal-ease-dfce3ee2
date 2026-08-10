import { useState, useEffect } from "react";
import { X, Check, Eye, EyeOff, Shield, CheckCheck, XCircle, Lock } from "lucide-react";
import { type User } from "@/lib/auth";
import { useFieldPermissions, FIELD_GROUPS, EMPLOYEE_FIELDS } from "@/lib/field-permissions";
import { Button } from "@/components/ui/button";

type Props = {
  user: User | null;
  open: boolean;
  onClose: () => void;
};

export function EmployeeFieldPermissionsModal({ user: targetUser, open, onClose }: Props) {
  const { getUserPermissions, setUserPermissions, resetUserPermissions } = useFieldPermissions();
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [activeGroup, setActiveGroup] = useState<string>("all");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (targetUser) {
      setPerms(getUserPermissions(targetUser.id));
      setSaved(false);
    }
  }, [targetUser, getUserPermissions]);

  if (!open || !targetUser) return null;

  const isSuperAdmin = targetUser.role === "super_admin";

  const handleToggle = (fieldId: string) => {
    if (isSuperAdmin) return;
    setPerms((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  };

  const handleSelectAll = () => {
    if (isSuperAdmin) return;
    const next: Record<string, boolean> = {};
    for (const f of EMPLOYEE_FIELDS) next[f.id] = true;
    setPerms(next);
  };

  const handleDeselectAll = () => {
    if (isSuperAdmin) return;
    const next: Record<string, boolean> = {};
    for (const f of EMPLOYEE_FIELDS) next[f.id] = false;
    setPerms(next);
  };

  const handleHideSensitive = () => {
    if (isSuperAdmin) return;
    const next: Record<string, boolean> = { ...perms };
    for (const f of EMPLOYEE_FIELDS) {
      if (f.isSensitive || f.group === "financial") {
        next[f.id] = false;
      } else {
        next[f.id] = true;
      }
    }
    setPerms(next);
  };

  const handleSave = () => {
    setUserPermissions(targetUser.id, perms);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const filteredFields =
    activeGroup === "all"
      ? EMPLOYEE_FIELDS
      : EMPLOYEE_FIELDS.filter((f) => f.group === activeGroup);

  const enabledCount = EMPLOYEE_FIELDS.filter((f) => perms[f.id] !== false).length;
  const totalCount = EMPLOYEE_FIELDS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-xs" dir="rtl">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Eye className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  صلاحيات حقول الموظفين
                </h3>
                <span className="rounded-md bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5">
                  {targetUser.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  (@{targetUser.username})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                تحديد الحقول التي يستطيع هذا المستخدم الاطلاع عليها في جدول وتفاصيل الموظفين
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Super admin alert */}
        {isSuperAdmin && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-primary-ink font-medium">
            <Shield className="size-4 shrink-0 text-primary" />
            <span>
              هذا الحساب يمتلك دور <strong>مدير عام (Super Admin)</strong> ولديه صلاحية كاملة تلقائياً لرؤية جميع الحقول دون قيود.
            </span>
          </div>
        )}

        {/* Action bar */}
        {!isSuperAdmin && (
          <div className="border-b border-border bg-card px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Group Tabs */}
              <div className="flex flex-wrap gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => setActiveGroup("all")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeGroup === "all"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  الكل ({totalCount})
                </button>
                {FIELD_GROUPS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveGroup(g.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      activeGroup === g.id
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <CheckCheck className="size-3 text-emerald-600" /> تحديد الكل
                </button>
                <button
                  type="button"
                  onClick={handleHideSensitive}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                  title="إخفاء الرواتب والأرقام القومية والبنكية"
                >
                  <Lock className="size-3" /> حجب الحساسة
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <XCircle className="size-3" /> إلغاء الكل
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fields List */}
        <div className="max-h-[380px] overflow-y-auto p-6">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {filteredFields.map((field) => {
              const isChecked = isSuperAdmin ? true : perms[field.id] !== false;
              const groupInfo = FIELD_GROUPS.find((g) => g.id === field.group);
              return (
                <div
                  key={field.id}
                  onClick={() => handleToggle(field.id)}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all cursor-pointer select-none ${
                    isChecked
                      ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                      : "border-border bg-muted/20 opacity-70 hover:opacity-100"
                  } ${isSuperAdmin ? "cursor-default" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isChecked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-background"
                      }`}
                    >
                      {isChecked && <Check className="size-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground">
                          {field.label}
                        </span>
                        {field.isSensitive && (
                          <span className="rounded bg-destructive/10 text-destructive text-[10px] px-1.5 py-0.2 font-medium">
                            حساس
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {groupInfo?.icon} {groupInfo?.label}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isChecked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                        <Eye className="size-3" /> متاح
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        <EyeOff className="size-3" /> محجوب
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
          <div className="text-xs text-muted-foreground">
            الحقول المتاحة: <strong className="text-foreground">{enabledCount}</strong> من أصل {totalCount}
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            {!isSuperAdmin && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saved}
                className="flex items-center gap-1.5 min-w-[100px]"
              >
                {saved ? (
                  <>
                    <Check className="size-4" /> تم الحفظ!
                  </>
                ) : (
                  "حفظ التغييرات"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
