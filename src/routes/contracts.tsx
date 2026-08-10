import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PageShell, Panel } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { contractWorkflow } from "@/lib/legal-data";
import { useProfilesOptions } from "@/lib/useSupabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeesTab } from "@/components/legal/EmployeesTab";
import { Button } from "@/components/ui/button";
import { hrSupabase } from "@/lib/hr-supabase";
import { supabase } from "@/lib/supabase";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { EmployeeCell } from "@/components/legal/EmployeeCell";

export const Route = createFileRoute("/contracts")({
  head: () => ({
    meta: [
      { title: "عقود الموظفين — نظام INT القانوني" },
      {
        name: "description",
        content: "إدارة عقود الموظفين وأنواعها ودورة اعتمادها وتواريخ بدايتها وانتهائها ومزامنتها من HR.",
      },
      { property: "og:title", content: "عقود الموظفين — نظام INT" },
      { property: "og:description", content: "دورة حياة العقد من المسودة حتى التجديد مع المزامنة التلقائية." },
    ],
  }),
  component: ContractsPage,
});

function ContractsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profilesOptions = useProfilesOptions();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Sync HR contracts into Legal contracts table
  const handleSyncHRContracts = async () => {
    setIsSyncing(true);
    setSyncStatus(null);

    try {
      // 1. Fetch employees from HR with contracts
      const { data: hrProfiles, error: hrError } = await hrSupabase
        .from("profiles")
        .select("id, emp_code, full_name, contract_type, contract_start_date, contract_end_date, salary_amount, status")
        .or("contract_start_date.not.is.null,contract_end_date.not.is.null");

      if (hrError) throw hrError;

      if (!hrProfiles || hrProfiles.length === 0) {
        setSyncStatus({ type: "error", message: "لم يتم العثور على عقود مسجلة في نظام HR للمزامنة." });
        setIsSyncing(false);
        return;
      }

      // 2. Prepare contract rows
      const today = new Date();
      const contractRows = hrProfiles.map((emp) => {
        const endDate = emp.contract_end_date ? new Date(emp.contract_end_date) : null;
        let contractStatus = "نشط";
        if (endDate && endDate < today) {
          contractStatus = "منتهي";
        } else if (emp.status !== "Active") {
          contractStatus = "قيد المراجعة";
        }

        const contractNo = emp.emp_code ? `CT-${emp.emp_code}` : `CT-${emp.id.slice(0, 6).toUpperCase()}`;

        return {
          no: contractNo,
          employee_id: emp.id,
          type: "توظيف",
          start_date: emp.contract_start_date || null,
          end_date: emp.contract_end_date || null,
          salary: emp.salary_amount ? Number(emp.salary_amount) : null,
          status: contractStatus,
        };
      });

      // 3. Upsert into Supabase contracts table
      const { error: upsertError } = await supabase
        .from("contracts")
        .upsert(contractRows, { onConflict: "no" });

      if (upsertError) throw upsertError;

      // 4. Invalidate contracts query to reload table
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });

      setSyncStatus({
        type: "success",
        message: `تمت مزامنة ${contractRows.length} عقداً بنجاح من قاعدة بيانات الـ HR!`,
      });
    } catch (err: any) {
      console.error("Sync HR contracts failed:", err);
      setSyncStatus({
        type: "error",
        message: `فشلت المزامنة: ${err.message || "حدث خطأ غير متوقع"}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <PageShell
      title="عقود الموظفين"
      description="إدارة ومتابعة عقود العمل ودورة الاعتماد والتجديد مع المزامنة المباشرة من نظام الموارد البشرية (HR)."
      actions={
        <Button
          onClick={handleSyncHRContracts}
          disabled={isSyncing}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold shadow-xs"
        >
          <RefreshCw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "جاري المزامنة من HR..." : "مزامنة عقود الـ HR"}
        </Button>
      }
    >
      {syncStatus && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl mb-4 text-sm font-medium border ${
            syncStatus.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
          dir="rtl"
        >
          {syncStatus.type === "success" ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="size-5 shrink-0 text-destructive" />
          )}
          <span>{syncStatus.message}</span>
        </div>
      )}

      <Tabs defaultValue="contracts" className="mt-2" dir="rtl">
        <TabsList className="mb-4">
          <TabsTrigger value="contracts">سجل العقود القانونية</TabsTrigger>
          <TabsTrigger value="employees">دليل الموظفين (نظام HR)</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="mt-0 outline-none">
          <Panel title="دورة حياة العقد القانوني">
            <ol className="flex flex-wrap items-center gap-2">
              {contractWorkflow.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                    {s}
                  </span>
                  {i < contractWorkflow.length - 1 ? (
                    <span className="text-muted-foreground">←</span>
                  ) : null}
                </li>
              ))}
            </ol>
          </Panel>

          <div className="mt-5 grid gap-5 lg:grid-cols-1">
            <CrudTable
              filters={{ type: "توظيف" }}
              className="lg:col-span-1"
              title="سجل العقود"
              subtitle="يمكنك النقر على أي عقد لعرض تفاصيله الكاملة وملف الموظف المرتبط"
              addLabel="عقد توظيف جديد"
              storageKey="contracts"
              tableName="contracts"
              seed={[{ type: "توظيف" }]}
              idKey="no"
              idPrefix="CT-"
              onRowClick={(row: any) => {
                if (row.no) {
                  router.navigate({ to: `/contracts/${row.no}` as any });
                }
              }}
              fields={[
                { key: "no", label: "رقم العقد", type: "mono", required: true },
                {
                  key: "employee_id",
                  label: "الموظف",
                  type: "select",
                  options: profilesOptions,
                  required: true,
                  render: (val: any) => <EmployeeCell employeeId={val} />,
                },
                { key: "type", label: "النوع", type: "select", options: ["توظيف"], hideInForm: true },
                { key: "start_date", label: "البداية", type: "date" },
                { key: "end_date", label: "النهاية", type: "date" },
                { key: "salary", label: "الراتب", type: "number" },
                { key: "status", label: "الحالة", type: "status", options: contractWorkflow },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="employees" className="mt-0 outline-none">
          <EmployeesTab />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
