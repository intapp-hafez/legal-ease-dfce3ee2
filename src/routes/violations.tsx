import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageShell, Panel, DataTable, StatusPill, TagList } from "@/components/legal/PageShell";
import { violations } from "@/lib/legal-data";

const types = [
  "تنبيه شفهي",
  "إنذار أول",
  "إنذار ثانٍ",
  "إنذار نهائي",
  "تحقيق",
  "إيقاف عن العمل",
  "توصية بإنهاء الخدمة",
];

export const Route = createFileRoute("/violations")({
  head: () => ({
    meta: [
      { title: "مخالفات الموظفين — نظام INT القانوني" },
      {
        name: "description",
        content: "سجل المخالفات التأديبية للموظفين مع القرارات والمرفقات والشهود.",
      },
      { property: "og:title", content: "مخالفات الموظفين — نظام INT" },
      { property: "og:description", content: "إدارة السجل التأديبي والقرارات المتخذة." },
    ],
  }),
  component: ViolationsPage,
});

function ViolationsPage() {
  return (
    <PageShell
      title="مخالفات الموظفين"
      description="توثيق المخالفات التأديبية والقرارات الصادرة بشأنها."
      actions={
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="size-4" /> تسجيل مخالفة
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">
        <Panel title="أنواع المخالفات" className="lg:col-span-1">
          <TagList items={types} />
        </Panel>

        <Panel title="السجل التأديبي" className="lg:col-span-3">
          <DataTable
            columns={["الرقم", "الموظف", "القسم", "نوع المخالفة", "التاريخ", "القرار", "الحالة"]}
            rows={violations.map((v) => [
              <span className="font-mono text-xs text-muted-foreground">{v.no}</span>,
              <span className="font-medium">{v.employee}</span>,
              v.dept,
              v.type,
              v.date,
              v.decision,
              <StatusPill value={v.status} />,
            ])}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
