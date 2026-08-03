import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, TagList } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
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
      description="متابعة مهام الإدارة القانونية — إنشاء وتعديل وحذف المهام."
    >
      <div className="grid gap-5 lg:grid-cols-4">
        <Panel title="تصنيفات المهام" className="lg:col-span-1">
          <TagList items={categories} />
        </Panel>

        <CrudTable
          className="lg:col-span-3"
          title="قائمة المهام"
          addLabel="مهمة جديدة"
          storageKey="tasks"
          seed={tasks}
          idKey="no"
          idPrefix="TSK-"
          fields={[
            { key: "no", label: "رقم المهمة", type: "mono", required: true },
            { key: "title", label: "العنوان", required: true },
            { key: "category", label: "التصنيف", type: "select", options: categories },
            {
              key: "priority",
              label: "الأولوية",
              type: "select",
              options: ["منخفضة", "متوسطة", "عالية", "عاجلة"],
            },
            { key: "assignee", label: "المسؤول" },
            { key: "due", label: "الاستحقاق", type: "date" },
            { key: "progress", label: "الإنجاز", type: "progress" },
            {
              key: "status",
              label: "الحالة",
              type: "status",
              options: ["جديدة", "قيد التنفيذ", "بانتظار", "متأخرة", "مكتملة"],
            },
          ]}
        />
      </div>
    </PageShell>
  );
}
