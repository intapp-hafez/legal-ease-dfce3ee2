import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PageShell, Panel } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { useOptionList } from "@/lib/option-lists";
import { useProfilesOptions } from "@/lib/useSupabase";

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
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [creatorFilter, setCreatorFilter] = useState("");
  const { options: categories, add: addCategory } = useOptionList("task-categories", baseCategories);
  const profiles = useProfilesOptions();
  const router = useRouter();

  return (
    <PageShell
      title="المهام القانونية اليومية"
      description="متابعة مهام الإدارة القانونية — إنشاء وتعديل وحذف المهام."
    >
      <div>
        <CrudTable
          filters={{ category: filter, assignee_id: assigneeFilter, created_by: creatorFilter }}
          title="قائمة المهام"
          extraActions={
            <>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="h-9 min-w-[150px] rounded-md border border-border bg-background px-3 text-sm outline-none"
              >
                <option value="">جميع التصنيفات</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              
              <select 
                value={assigneeFilter} 
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="h-9 min-w-[150px] rounded-md border border-border bg-background px-3 text-sm outline-none"
              >
                <option value="">جميع المسؤولين</option>
                {profiles.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>

              <select 
                value={creatorFilter} 
                onChange={(e) => setCreatorFilter(e.target.value)}
                className="h-9 min-w-[150px] rounded-md border border-border bg-background px-3 text-sm outline-none"
              >
                <option value="">جميع المنشئين</option>
                {profiles.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </>
          }
          onRowClick={(row: any) => router.navigate({ to: `/tasks/${row.id}` })}
          addLabel="مهمة جديدة"
          storageKey="tasks"
          tableName="tasks"
          seed={[]}
          idKey="id"
          sequenceKey="no"
          idPrefix="TSK-"
          fields={[
            { key: "no", label: "رقم المهمة", type: "mono", required: true },
            { key: "title", label: "العنوان", required: true },
            { key: "description", label: "التفاصيل", type: "textarea", hideInForm: false },
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
              key: "assignee_id",
              label: "المسؤول",
              type: "select",
              options: profiles,
            },
            {
              key: "created_by",
              label: "المنشئ",
              type: "select",
              options: profiles,
              hideInForm: true,
            },
            { key: "due_date", label: "الاستحقاق", type: "date" },
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
