import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { PageShell, Panel, StatusPill } from "@/components/legal/PageShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/contracts/$contractId")({
  component: ContractDetailsPage,
});

function ContractDetailsPage() {
  const router = useRouter();
  const { contractId } = Route.useParams();

  // Fetch contract by no
  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          employee:profiles!contracts_employee_id_fkey(full_name, department)
        `)
        .eq("no", contractId)
        .single();
        
      if (error) {
        console.error("Fetch contract failed.", error);
        throw error;
      }
      return data;
    }
  });

  if (isLoading) {
    return (
      <PageShell title="جاري التحميل..." description="جاري تحميل تفاصيل العقد">
        <div className="py-8 text-center text-sm text-muted-foreground">الرجاء الانتظار...</div>
      </PageShell>
    );
  }

  if (!contract) {
    return (
      <PageShell title="عقد غير موجود" description="لم يتم العثور على العقد المطلوب">
        <button onClick={() => router.history.back()} className="text-primary underline">العودة</button>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`تفاصيل العقد: ${contract.no}`}
      description="عرض بيانات العقد بالكامل"
      actions={
        <button 
          onClick={() => router.navigate({ to: "/contracts" })}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="size-4" />
          العودة للعقود
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel title="معلومات العقد">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">رقم العقد:</span>
                <span className="font-medium text-primary">{contract.no}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">نوع العقد:</span>
                <span className="font-medium">{contract.type || "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">الموظف المرتبط:</span>
                <span className="font-medium">{contract.employee?.full_name || "غير محدد"}</span>
              </div>
              {contract.employee?.department && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">الإدارة:</span>
                  <span className="font-medium">{contract.employee.department}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2 items-center">
                <span className="text-muted-foreground">الحالة:</span>
                <StatusPill value={contract.status} />
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="التفاصيل المالية والزمنية">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">تاريخ البداية:</span>
                <span className="font-medium">{contract.start_date ? new Date(contract.start_date).toLocaleDateString('ar-EG') : "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">تاريخ النهاية:</span>
                <span className="font-medium">{contract.end_date ? new Date(contract.end_date).toLocaleDateString('ar-EG') : "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">الراتب / القيمة:</span>
                <span className="font-medium">{contract.salary ? `${contract.salary} ر.س` : "—"}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
