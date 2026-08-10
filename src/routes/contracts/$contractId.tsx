import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronRight, FileText, User, Calendar, DollarSign, Clock, ShieldCheck } from "lucide-react";
import { PageShell, Panel, StatusPill } from "@/components/legal/PageShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { hrSupabase } from "@/lib/hr-supabase";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";

export const Route = createFileRoute("/contracts/$contractId")({
  component: ContractDetailsPage,
});

const fmtDate = (d: string | null) => formatDate(d);

const getRemainingDays = (dateStr: string | null) => {
  if (!dateStr) return null;
  const diffTime = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

function ContractDetailsPage() {
  const router = useRouter();
  const { contractId } = Route.useParams();

  // Fetch contract by no
  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("no", contractId)
        .single();
        
      if (error) {
        console.error("Fetch contract failed.", error);
        throw error;
      }

      // Fetch employee info from hrSupabase if employee_id exists
      let employeeData = null;
      if (data?.employee_id) {
        try {
          const hrRes = await hrSupabase
            .from("profiles")
            .select("id, full_name, emp_code, phone, email, departments!profiles_department_id_fkey(name_ar, name_en), positions(name_ar, name_en)")
            .eq("id", data.employee_id)
            .single();
          if (hrRes.data) {
            const emp = hrRes.data as any;
            employeeData = {
              id: emp.id,
              full_name: emp.full_name,
              emp_code: emp.emp_code,
              email: emp.email,
              phone: emp.phone,
              department: emp.departments?.name_ar || emp.departments?.name_en || "—",
              position: emp.positions?.name_ar || emp.positions?.name_en || "—",
            };
          }
        } catch (e) {
          console.warn("Could not fetch HR employee for contract:", e);
        }
      }

      return { ...data, employee: employeeData };
    }
  });

  if (isLoading) {
    return (
      <PageShell title="جاري التحميل..." description="جاري تحميل تفاصيل العقد">
        <div className="flex flex-col items-center justify-center py-20 gap-3" dir="rtl">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">الرجاء الانتظار...</p>
        </div>
      </PageShell>
    );
  }

  if (!contract) {
    return (
      <PageShell title="عقد غير موجود" description="لم يتم العثور على العقد المطلوب">
        <div className="py-12 text-center" dir="rtl">
          <Button variant="outline" onClick={() => router.history.back()}>
            العودة للسابق
          </Button>
        </div>
      </PageShell>
    );
  }

  const remainingDays = getRemainingDays(contract.end_date);

  return (
    <PageShell
      title={`تفاصيل العقد: ${contract.no}`}
      description={contract.employee?.full_name ? `عقد الموظف: ${contract.employee.full_name}` : "عرض وتفاصيل العقد"}
      actions={
        <Button 
          variant="outline"
          size="sm"
          onClick={() => router.navigate({ to: "/contracts" })}
          className="flex items-center gap-1.5 text-xs font-medium"
        >
          <ChevronRight className="size-4" />
          العودة لسجل العقود
        </Button>
      }
    >
      <div className="space-y-6" dir="rtl">
        {/* Header Summary */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                <FileText className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-mono text-foreground">{contract.no}</h2>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-sans">
                    {contract.type || "توظيف"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  الموظف: <span className="font-semibold text-foreground">{contract.employee?.full_name || contract.employee_id || "غير محدد"}</span>
                  {contract.employee?.emp_code && ` [${contract.employee.emp_code}]`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusPill value={contract.status} />
              {contract.employee?.id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.navigate({ to: `/employee/${contract.employee.id}` as any })}
                  className="text-xs"
                >
                  عرض ملف الموظف ←
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Contract Info Panels */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Main Info */}
          <Panel title="معلومات العقد الأساسية">
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-2.5">
                <span className="text-muted-foreground flex items-center gap-2"><FileText className="size-4 text-primary" /> رقم العقد:</span>
                <span className="font-mono font-bold text-primary">{contract.no}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2.5">
                <span className="text-muted-foreground flex items-center gap-2"><FileText className="size-4 text-primary" /> نوع العقد:</span>
                <span className="font-medium">{contract.type || "توظيف"}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2.5">
                <span className="text-muted-foreground flex items-center gap-2"><User className="size-4 text-primary" /> الموظف المرتبط:</span>
                <span className="font-semibold">{contract.employee?.full_name || contract.employee_id || "—"}</span>
              </div>
              {contract.employee?.department && (
                <div className="flex justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground">الإدارة / القسم:</span>
                  <span className="font-medium">{contract.employee.department}</span>
                </div>
              )}
              {contract.employee?.position && (
                <div className="flex justify-between border-b border-border/50 pb-2.5">
                  <span className="text-muted-foreground">المسمى الوظيفي:</span>
                  <span className="font-medium">{contract.employee.position}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> حالة العقد:</span>
                <StatusPill value={contract.status} />
              </div>
            </div>
          </Panel>

          {/* Financial & Timeframe */}
          <Panel title="التفاصيل الزمنية والمالية">
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-2.5">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="size-4 text-primary" /> تاريخ البداية:</span>
                <span className="font-mono font-medium">{fmtDate(contract.start_date)}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2.5">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="size-4 text-primary" /> تاريخ النهاية:</span>
                <div className="text-left font-mono">
                  <div>{fmtDate(contract.end_date)}</div>
                  {remainingDays !== null && (
                    <div className="text-xs mt-0.5">
                      {remainingDays < 0 ? (
                        <span className="text-destructive font-semibold">منتهي (قبل {Math.abs(remainingDays)} يوم)</span>
                      ) : remainingDays < 30 ? (
                        <span className="text-amber-600 font-semibold">متبقي {remainingDays} يوم</span>
                      ) : (
                        <span className="text-muted-foreground">متبقي {remainingDays} يوم</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2.5">
                <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="size-4 text-primary" /> الراتب المسجل:</span>
                <span className="font-mono font-bold text-foreground">
                  {contract.salary ? `${Number(contract.salary).toLocaleString()} ج.م` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Clock className="size-4 text-primary" /> تاريخ التسجيل بالنظام:</span>
                <span className="font-mono text-muted-foreground">{fmtDate(contract.created_at)}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
