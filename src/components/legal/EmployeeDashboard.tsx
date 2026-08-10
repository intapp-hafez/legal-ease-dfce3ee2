import {
  ListChecks,
  Inbox,
  FileCheck2,
  Undo2,
  FileText,
} from "lucide-react";
import { PageShell, Panel, StatusPill, DataTable } from "@/components/legal/PageShell";
import {
  employeeKPIs as defaultKPIs,
} from "@/lib/legal-data";
import { useAuth } from "@/lib/auth";
import { useRouter } from "@tanstack/react-router";
import { useEmployeeDashboard } from "@/hooks/useDashboard";

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
  const { data, isLoading } = useEmployeeDashboard(user?.id);
  
  if (isLoading || !data) {
    return (
      <PageShell title={`مرحباً بك، ${user?.name || "الموظف"}`} description="جاري التحميل...">
        <div className="flex h-64 items-center justify-center">
          <span className="text-muted-foreground">جاري جلب البيانات...</span>
        </div>
      </PageShell>
    );
  }

  const { activeTasks, assignedAssets, tasks } = data;

  const dynamicKPIs = [
    { label: "مهام قيد التنفيذ", value: activeTasks, icon: "listChecks", tone: "warning" },
    { label: "عهد و أصول", value: assignedAssets, icon: "package", tone: "success" },
  ] as const;

  return (
    <PageShell
      title={`مرحباً بك، ${user?.name || "الموظف"}`}
      description="إليك ملخص مهامك، طلباتك، ومستنداتك النشطة في النظام."
    >
      {/* KPIs Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {dynamicKPIs.map((k, i) => {
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
          {tasks.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              لا توجد مهام مسندة إليك حالياً.
            </div>
          ) : (
            <DataTable
              columns={["المهمة", "الأولوية", "الحالة", "الإنجاز"]}
              onRowClick={(i) => router.navigate({ to: `/employee/tasks/${tasks[i]?.id}` })}
              rows={tasks.map((t: any) => [
                <span key="title" className="font-medium">{t.title}</span>,
                <span key="priority" className="text-muted-foreground">{t.priority}</span>,
                <StatusPill key="status" value={t.status} />,
                <div key="progress" className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${t.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{t.progress || 0}%</span>
                </div>,
              ])}
            />
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
