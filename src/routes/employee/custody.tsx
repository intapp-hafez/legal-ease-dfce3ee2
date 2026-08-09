import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, StatusPill, DataTable } from "@/components/legal/PageShell";
import { employeeCustody } from "@/lib/legal-data";

export const Route = createFileRoute("/employee/custody")({
  head: () => ({
    meta: [{ title: "عهدتي — نظام INT القانوني" }],
  }),
  component: EmployeeCustodyPage,
});

function EmployeeCustodyPage() {
  return (
    <PageShell
      title="عهدتي"
      description="الأصول والعهد المسجلة باسمك."
    >
      <div className="space-y-5">
        <Panel title="سجل العهد">
          <DataTable
            columns={["رقم العهدة", "الاسم", "تاريخ الاستلام", "الحالة"]}
            rows={employeeCustody.map((c) => [
              <span key="id" className="font-medium text-primary">{c.id}</span>,
              <span key="name">{c.name}</span>,
              <span key="date" className="text-muted-foreground">{c.date}</span>,
              <StatusPill key="status" value={c.status} />,
            ])}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
