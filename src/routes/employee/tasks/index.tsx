import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageShell, Panel, StatusPill, DataTable } from "@/components/legal/PageShell";
import { employeeTasks } from "@/lib/legal-data";

export const Route = createFileRoute("/employee/tasks/")({
  head: () => ({
    meta: [{ title: "المهام اليومية — نظام INT القانوني" }],
  }),
  component: EmployeeTasksPage,
});

function EmployeeTasksPage() {
  const router = useRouter();
  
  return (
    <PageShell
      title="المهام اليومية"
      description="قائمة المهام المسندة إليك لإنجازها."
    >
      <div className="space-y-5">
        <Panel title="مهامي الحالية" subtitle="انقر على المهمة لعرض التفاصيل وإضافة ملاحظات">
          <DataTable
            columns={["المهمة", "الأولوية", "الحالة", "الإنجاز"]}
            onRowClick={(i) => router.navigate({ to: `/employee/tasks/${employeeTasks[i]?.id}` })}
            rows={employeeTasks.map((t) => [
              <span key="title" className="font-medium">{t.title}</span>,
              <span key="priority" className="text-muted-foreground">{t.priority}</span>,
              <StatusPill key="status" value={t.status} />,
              <div key="progress" className="flex items-center gap-2">
                <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{t.progress}%</span>
              </div>,
            ])}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
