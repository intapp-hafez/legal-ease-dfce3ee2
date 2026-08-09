import {
  ListChecks,
  Inbox,
  FileCheck2,
  Undo2,
  FileText,
} from "lucide-react";
import { PageShell, Panel, StatusPill, DataTable } from "@/components/legal/PageShell";
import {
  employeeKPIs,
  employeeTasks,
} from "@/lib/legal-data";
import { useAuth } from "@/lib/auth";
import { useRouter } from "@tanstack/react-router";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  listChecks: ListChecks,
  inbox: Inbox,
  fileCheck: FileCheck2,
  undo: Undo2,
};

const cardTone: Record<string, string> = {
  default: "border-primary/25 bg-primary/8",
  success: "border-success/25 bg-success/10",
  warning: "border-warning/30 bg-warning/12",
  danger: "border-destructive/25 bg-destructive/8",
};

const valueTone: Record<string, string> = {
  default: "text-[var(--primary-ink)]",
  success: "text-success",
  warning: "text-[var(--warning-ink)]",
  danger: "text-destructive",
};

export function EmployeeDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  return (
    <PageShell
      title={`مرحباً بك، ${user?.name || "الموظف"}`}
      description="إليك ملخص مهامك، طلباتك، ومستنداتك النشطة في النظام."
    >
      {/* KPIs Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {employeeKPIs.map((k, i) => {
          const Icon = icons[k.icon] || FileText;
          return (
            <div
              key={i}
              className={`flex items-center gap-4 rounded-xl border p-5 transition-shadow hover:shadow-md ${cardTone[k.tone]}`}
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
                <Icon className={`size-5 ${valueTone[k.tone]}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${valueTone[k.tone]}`}>{k.value}</p>
                <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* My Tasks */}
        <Panel title="مهامي الحالية" subtitle="المهام المسندة إليك والتي تتطلب إجراءً.">
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
