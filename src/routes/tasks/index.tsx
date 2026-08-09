import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { tasks } from "@/lib/legal-data";
import { useOptionList } from "@/lib/option-lists";

const baseCategories = [
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

export const Route = createFileRoute("/tasks/")({
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
  const [filter, setFilter] = useState("");
  const { options: categories, add: addCategory } = useOptionList("task-categories", baseCategories);
  const router = useRouter();

  return (
    <PageShell
      title="المهام القانونية اليومية"
      description="متابعة مهام الإدارة القانونية — إنشاء وتعديل وحذف المهام."
    >
      <div>
        <CrudTable
          filters={{ category: filter }}
          title="قائمة المهام"
          extraActions={
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="h-9 min-w-[180px] rounded-md border border-border bg-background px-3 text-sm outline-none"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          }
          onRowClick={(row) => router.navigate({ to: `/tasks/${row.no}` })}
          addLabel="مهمة جديدة"
          storageKey="tasks"
          seed={tasks}
          idKey="no"
          idPrefix="TSK-"
          fields={[
            { key: "no", label: "رقم المهمة", type: "mono", required: true },
            { key: "title", label: "العنوان", required: true },
            {
              key: "category",
              label: "التصنيف",
              type: "select",
              options: categories,
              onAddOption: addCategory,
              addLabel: "إضافة تصنيف جديد",
            },
            {
              key: "priority",
              label: "الأولوية",
              type: "select",
              options: ["منخفضة", "متوسطة", "عالية", "عاجلة"],
            },
            {
              key: "assignee",
              label: "المسؤول",
              type: "select",
              options: ["أحمد محمد", "سارة أحمد", "خالد عبدالله"],
            },
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
