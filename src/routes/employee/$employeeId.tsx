import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, User, Mail, Phone, MapPin, Building, Briefcase, Calendar, Shield, DollarSign, Package, AlertTriangle } from "lucide-react";
import { PageShell, Panel } from "@/components/legal/PageShell";
import { hrSupabase } from "@/lib/hr-supabase";
import { Button } from "@/components/ui/button";
import { CrudTable } from "@/components/legal/CrudTable";
import { useCategories, useStatuses } from "@/lib/custody-options";
import { useOptionList } from "@/lib/option-lists";
import { formatDate } from "@/lib/date-utils";
import { useFieldPermissions } from "@/lib/field-permissions";

export const Route = createFileRoute("/employee/$employeeId")({
  component: EmployeeDetailsPage,
});

const baseViolationTypes = [
  "تنبيه شفهي",
  "إنذار أول",
  "إنذار ثانٍ",
  "إنذار نهائي",
  "تحقيق",
  "إيقاف عن العمل",
  "توصية بإنهاء الخدمة",
];

const getRemainingDays = (dateStr: string | null) => {
  if (!dateStr) return null;
  const diffTime = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const fmtDate = (d: string | null) => formatDate(d);

function EmployeeDetailsPage() {
  const router = useRouter();
  const { employeeId } = Route.useParams();
  const { canView } = useFieldPermissions();

  const { options: categories, add: addCategory } = useCategories();
  const { options: statuses, add: addStatus } = useStatuses();
  const { options: violationTypes, add: addViolationType } = useOptionList("violation-types", baseViolationTypes);

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ["hr-employee", employeeId],
    queryFn: async () => {
      const { data, error } = await hrSupabase
        .from("profiles")
        .select("*, departments!profiles_department_id_fkey(*), positions(*), cities!profiles_city_id_fkey(*), districts!profiles_district_id_fkey(*)")
        .eq("id", employeeId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <PageShell title="جاري التحميل..." description="جاري جلب تفاصيل الموظف من نظام HR">
        <div className="flex flex-col items-center justify-center py-20 gap-3" dir="rtl">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">جاري تحميل بيانات الموظف...</p>
        </div>
      </PageShell>
    );
  }

  if (error || !employee) {
    return (
      <PageShell title="موظف غير موجود" description="تعذر العثور على بيانات الموظف المطلوب">
        <div className="py-12 text-center" dir="rtl">
          <p className="text-sm text-destructive font-medium mb-4">
            {error ? (error as Error).message : "لم يتم العثور على الموظف"}
          </p>
          <Button variant="outline" onClick={() => router.history.back()}>
            العودة للسابق
          </Button>
        </div>
      </PageShell>
    );
  }

  const contractDays = getRemainingDays(employee.contract_end_date);
  const idDays = getRemainingDays(employee.id_expiry_date);

  const employeeName = employee.full_name || employee.name || "الموظف";
  const hasFinancialPerms =
    canView("salary_amount") ||
    canView("salary_type") ||
    canView("is_insured") ||
    canView("insurance_number") ||
    canView("bank_account_number");

  const hasDatesPerms =
    canView("contract_start_date") ||
    canView("contract_end_date") ||
    canView("id_issue_date") ||
    canView("id_expiry_date");

  return (
    <PageShell
      title={employeeName}
      description={`الرقم الوظيفي: ${canView("emp_code") ? (employee.emp_code || "—") : "••••"} · ${canView("position_id") ? (employee.positions?.name_ar || employee.positions?.name_en || "") : ""} ${(employee.positions && employee.departments) ? " - " : ""} ${canView("department_id") ? (employee.departments?.name_ar || employee.departments?.name_en || "") : ""}`}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.navigate({ to: "/contracts" })}
          className="flex items-center gap-1.5 text-xs font-medium"
        >
          <ChevronRight className="size-4" />
          العودة لدليل الموظفين
        </Button>
      }
    >
      <div className="space-y-6" dir="rtl">
        {/* Top Summary Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {employee.avatar_url ? (
                <img
                  src={employee.avatar_url}
                  alt={employeeName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-xs shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20 shrink-0">
                  {employee.full_name ? employee.full_name.charAt(0) : <User className="size-7" />}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-foreground">{employeeName}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                  {canView("emp_code") && (
                    <>
                      <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground">{employee.emp_code || "بدون كود"}</span>
                      <span>•</span>
                    </>
                  )}
                  {canView("position_id") && (
                    <>
                      <span>{employee.positions?.name_ar || employee.positions?.name_en || "غير محدد"}</span>
                      <span>•</span>
                    </>
                  )}
                  {canView("department_id") && (
                    <span>{employee.departments?.name_ar || employee.departments?.name_en || "غير محدد"}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                employee.status === "Active" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" :
                employee.status === "Inactive" ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300" :
                "bg-secondary text-secondary-foreground"
              }`}>
                {employee.status === "Active" ? "نشط" : employee.status === "Inactive" ? "غير نشط" : employee.status || "—"}
              </span>
              {canView("is_insured") && (
                employee.is_insured ? (
                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                    مؤمن عليه ✓
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-muted text-muted-foreground">
                    غير مؤمن
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal & Contact Details */}
          <Panel title="البيانات الشخصية وبيانات الاتصال">
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <span className="text-muted-foreground flex items-center gap-2"><User className="size-4 text-primary" /> الاسم الكامل:</span>
                <span className="font-semibold text-foreground">{employeeName}</span>
              </div>
              {canView("national_id") && (
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground flex items-center gap-2"><Shield className="size-4 text-primary" /> الرقم القومي:</span>
                  <span className="font-mono font-semibold text-foreground">{employee.national_id || "—"}</span>
                </div>
              )}
              {canView("email") && (
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground flex items-center gap-2"><Mail className="size-4 text-primary" /> البريد الإلكتروني:</span>
                  <span className="text-foreground">{employee.email || "—"}</span>
                </div>
              )}
              {canView("phone") && (
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground flex items-center gap-2"><Phone className="size-4 text-primary" /> رقم الهاتف:</span>
                  <span className="font-mono text-foreground" dir="ltr">{employee.phone || "—"}</span>
                </div>
              )}
              {canView("gender") && (
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground flex items-center gap-2"><User className="size-4 text-primary" /> النوع (الجنس):</span>
                  <span className="text-foreground">{employee.gender === "male" ? "ذكر" : employee.gender === "female" ? "أنثى" : employee.gender || "—"}</span>
                </div>
              )}
              {(canView("city_id") || canView("district_id")) && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><MapPin className="size-4 text-primary" /> المدينة والحي:</span>
                  <span className="text-foreground">
                    {[
                      canView("city_id") && (employee.cities?.name_ar || employee.cities?.name_en),
                      canView("district_id") && (employee.districts?.name_ar || employee.districts?.name_en)
                    ].filter(Boolean).join(" - ") || "—"}
                  </span>
                </div>
              )}
            </div>
          </Panel>

          {/* Job & Org Details */}
          <Panel title="البيانات الوظيفية والإدارية">
            <div className="space-y-3.5 text-sm">
              {canView("emp_code") && (
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="size-4 text-primary" /> الرقم الوظيفي:</span>
                  <span className="font-mono font-semibold text-foreground">{employee.emp_code || "—"}</span>
                </div>
              )}
              {canView("department_id") && (
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground flex items-center gap-2"><Building className="size-4 text-primary" /> الإدارة / القسم:</span>
                  <span className="font-medium text-foreground">{employee.departments?.name_ar || employee.departments?.name_en || "—"}</span>
                </div>
              )}
              {canView("position_id") && (
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="size-4 text-primary" /> المسمى الوظيفي:</span>
                  <span className="font-medium text-foreground">{employee.positions?.name_ar || employee.positions?.name_en || "—"}</span>
                </div>
              )}
              {canView("role") && (
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground flex items-center gap-2"><Shield className="size-4 text-primary" /> الدور / الصلاحية:</span>
                  <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs">{employee.role || "—"}</span>
                </div>
              )}
              {canView("contract_type") && (
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="size-4 text-primary" /> نوع العقد:</span>
                  <span className="font-medium text-foreground">{employee.contract_type || "—"}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="size-4 text-primary" /> تاريخ التسجيل:</span>
                <span className="font-mono text-muted-foreground">{fmtDate(employee.created_at)}</span>
              </div>
            </div>
          </Panel>

          {/* Contract & Dates Details */}
          {hasDatesPerms && (
            <Panel title="تواريخ العقد والهوية">
              <div className="space-y-3.5 text-sm">
                {canView("contract_start_date") && (
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="size-4 text-primary" /> بداية العقد:</span>
                    <span className="font-mono text-foreground">{fmtDate(employee.contract_start_date)}</span>
                  </div>
                )}
                {canView("contract_end_date") && (
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="size-4 text-primary" /> نهاية العقد:</span>
                    <div className="text-left font-mono">
                      <div>{fmtDate(employee.contract_end_date)}</div>
                      {contractDays !== null && (
                        <div className="text-xs mt-0.5">
                          {contractDays < 0 ? (
                            <span className="text-destructive font-semibold">منتهي (قبل {Math.abs(contractDays)} يوم)</span>
                          ) : contractDays < 30 ? (
                            <span className="text-amber-600 font-semibold">متبقي {contractDays} يوم</span>
                          ) : (
                            <span className="text-muted-foreground">متبقي {contractDays} يوم</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {canView("id_issue_date") && (
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="size-4 text-primary" /> تاريخ إصدار الهوية:</span>
                    <span className="font-mono text-foreground">{fmtDate(employee.id_issue_date)}</span>
                  </div>
                )}
                {canView("id_expiry_date") && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="size-4 text-primary" /> تاريخ انتهاء الهوية:</span>
                    <div className="text-left font-mono">
                      <div>{fmtDate(employee.id_expiry_date)}</div>
                      {idDays !== null && (
                        <div className="text-xs mt-0.5">
                          {idDays < 0 ? (
                            <span className="text-destructive font-semibold">منتهي (قبل {Math.abs(idDays)} يوم)</span>
                          ) : idDays < 30 ? (
                            <span className="text-amber-600 font-semibold">متبقي {idDays} يوم</span>
                          ) : (
                            <span className="text-muted-foreground">متبقي {idDays} يوم</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* Financial & Insurance */}
          {hasFinancialPerms && (
            <Panel title="البيانات المالية والتأمينية">
              <div className="space-y-3.5 text-sm">
                {canView("salary_type") && (
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="size-4 text-primary" /> نوع الراتب:</span>
                    <span className="font-medium text-foreground">{employee.salary_type || "—"}</span>
                  </div>
                )}
                {canView("salary_amount") && employee.salary_amount && (
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="size-4 text-primary" /> قيمة الراتب:</span>
                    <span className="font-mono font-bold text-primary">{Number(employee.salary_amount).toLocaleString()} ج.م</span>
                  </div>
                )}
                {canView("is_insured") && (
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <span className="text-muted-foreground flex items-center gap-2"><Shield className="size-4 text-primary" /> حالة التأمين:</span>
                    <span className={`font-semibold ${employee.is_insured ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {employee.is_insured ? "مؤمن عليه" : "غير مؤمن عليه"}
                    </span>
                  </div>
                )}
                {canView("insurance_number") && employee.insurance_number && (
                  <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                    <span className="text-muted-foreground flex items-center gap-2"><Shield className="size-4 text-primary" /> الرقم التأميني:</span>
                    <span className="font-mono text-foreground">{employee.insurance_number}</span>
                  </div>
                )}
                {canView("bank_account_number") && employee.bank_account_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="size-4 text-primary" /> الحساب البنكي:</span>
                    <span className="font-mono text-foreground">{employee.bank_account_number} {employee.bank_account_name ? `(${employee.bank_account_name})` : ""}</span>
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>

        {/* ── Custody / Assets Section ── */}
        <div className="space-y-3">
          <CrudTable
            title={`عهد الموظف (${employeeName})`}
            subtitle="سجل الأجهزة والمعدات والعهد المسندة للموظف"
            addLabel="إسناد عهدة جديدة"
            storageKey={`assets_${employeeId}`}
            tableName="assets"
            filters={{ employee_id: employeeId }}
            seed={[]}
            idKey="code"
            idPrefix="AST-"
            fields={[
              { key: "code", label: "كود الأصل", type: "mono", required: true },
              { key: "name", label: "اسم الأصل", required: true },
              { key: "category", label: "الفئة", type: "select", options: categories, onAddOption: addCategory, addLabel: "إضافة فئة" },
              { key: "serial_number", label: "الرقم التسلسلي", type: "mono" },
              { key: "assigned_date", label: "تاريخ الإسناد", type: "date" },
              { key: "expected_return_date", label: "الإرجاع المتوقع", type: "date" },
              {
                key: "condition",
                label: "الحالة الفنية",
                type: "select",
                options: ["ممتازة", "جيدة", "مقبولة", "تحتاج إصلاح", "—"],
              },
              {
                key: "status",
                label: "حالة العهدة",
                type: "status",
                options: statuses,
                onAddOption: addStatus,
                addLabel: "إضافة حالة",
              },
              {
                key: "employee_id",
                label: "الموظف",
                type: "select",
                options: [{ value: employeeId, label: employeeName }],
                hideInForm: true,
              },
            ]}
          />
        </div>

        {/* ── Violations Section ── */}
        <div className="space-y-3">
          <CrudTable
            title={`مخالفات الموظف (${employeeName})`}
            subtitle="سجل المخالفات التأديبية والقرارات الصادرة"
            addLabel="تسجيل مخالفة جديدة"
            storageKey={`violations_${employeeId}`}
            tableName="violations"
            filters={{ employee_id: employeeId }}
            seed={[]}
            idKey="no"
            idPrefix="VL-"
            fields={[
              { key: "no", label: "رقم المخالفة", type: "mono", required: true },
              {
                key: "type",
                label: "نوع المخالفة",
                type: "select",
                options: violationTypes,
                onAddOption: addViolationType,
                addLabel: "إضافة نوع جديد",
                required: true,
              },
              { key: "violation_date", label: "تاريخ المخالفة", type: "date" },
              { key: "decision", label: "القرار المتخذ", type: "textarea" },
              {
                key: "status",
                label: "الحالة",
                type: "status",
                options: ["مفتوحة", "قيد التحقيق", "مغلقة"],
              },
              {
                key: "employee_id",
                label: "الموظف",
                type: "select",
                options: [{ value: employeeId, label: employeeName }],
                hideInForm: true,
              },
            ]}
          />
        </div>
      </div>
    </PageShell>
  );
}
