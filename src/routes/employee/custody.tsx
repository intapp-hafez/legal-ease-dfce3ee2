import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, Panel, StatusPill, DataTable } from "@/components/legal/PageShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/employee/custody")({
  head: () => ({
    meta: [{ title: "عهدتي — نظام INT القانوني" }],
  }),
  component: EmployeeCustodyPage,
});

function EmployeeCustodyPage() {
  const { user } = useAuth();

  const { data: custodyList = [], isLoading } = useQuery({
    queryKey: ["employee-custody", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("employee_id", user!.id)
        .order("assigned_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <PageShell title="عهدتي" description="الأصول والعهد المسجلة باسمك.">
      <div className="space-y-5">
        <Panel title="سجل العهد">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              جاري تحميل العهد...
            </div>
          ) : custodyList.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              لا توجد عهد مسجلة باسمك حالياً.
            </div>
          ) : (
            <DataTable
              columns={["رقم العهدة", "الاسم", "تاريخ الاستلام", "الحالة"]}
              rows={custodyList.map((c: any) => [
                <span key="id" className="font-medium text-primary">
                  {c.code || c.id}
                </span>,
                <span key="name">{c.name}</span>,
                <span key="date" className="text-muted-foreground">
                  {c.assigned_date || "—"}
                </span>,
                <StatusPill key="status" value={c.status || "مُسندة"} />,
              ])}
            />
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
