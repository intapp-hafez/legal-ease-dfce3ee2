import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageShell, Panel, DataTable, StatusPill, TagList } from "@/components/legal/PageShell";
import { tasks } from "@/lib/legal-data";

const categories = [
  "إعداد عقود",
  "مراجعة عقود",
  "حضور جلسات",
  "مراجعات حكومية",
  "تجديد تراخيص",
  "تحقيق موظفين",
  "استشارة قانونية",
  "مراجعة اتفاقيات",
  "مراجعة سياسات",
  "الامتثال",
  "عقود موردين",
  "عقود عملاء",
  "متابعة",
];

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "المهام القانونية اليومية — نظام INT القانوني" },
      {
        name: "description",
        content: "تنظيم مهام المستشار القانوني اليومية مع الأولويات ونسب الإنجاز والتذكيرات.",
      },
      { property: "og:title", content: "المهام القانونية اليومية — نظام INT" },
      { property: "og:description", content: "إدارة المهام والأولويات ونسب الإنجاز." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  return (
    <PageShell
      title="المهام القانونية اليومية"
      description="متابعة مهام الإدارة القانونية بالأولوية وتاريخ الاستحقاق ونسبة الإنجاز."
      actions={
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="size-4" /> مهمة جديدة
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">
        <Panel title="تصنيفات المهام" className="lg:col-span-1">
          <TagList items={categories} />
        </Panel>

        <Panel title="قائمة المهام" className="lg:col-span-3">
          <DataTable
            columns={[
              "رقم المهمة",
              "العنوان",
              "التصنيف",
              "الأولوية",
              "المسؤول",
              "الاستحقاق",
              "الإنجاز",
              "الحالة",
            ]}
            rows={tasks.map((t) => [
              <span className="font-mono text-xs text-muted-foreground">{t.no}</span>,
              <span className="font-medium">{t.title}</span>,
              t.category,
              t.priority,
              t.assignee,
              t.due,
              <div className="flex w-28 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${t.progress}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{t.progress}%</span>
              </div>,
              <StatusPill value={t.status} />,
            ])}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
