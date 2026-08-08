import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, TagList } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { requests } from "@/lib/legal-data";
import { useOptionList } from "@/lib/option-lists";

const baseTypes = [
  "نسخة من العقد",
  "خطاب تعريف بالعمل",
  "خطاب تعريف بالراتب",
  "اتفاقية عدم إفصاح",
  "خطاب تأشيرة",
  "شكوى",
  "استشارة قانونية",
  "مراجعة استقالة",
];

const workflow = ["الموظف", "المدير المباشر", "الموارد البشرية", "المستشار القانوني", "مكتمل"];

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "الطلبات القانونية — نظام INT القانوني" },
      {
        name: "description",
        content: "استقبال طلبات الموظفين القانونية ومتابعة مسار اعتمادها حتى الإنجاز.",
      },
      { property: "og:title", content: "الطلبات القانونية — نظام INT" },
      { property: "og:description", content: "مسار اعتماد طلبات الموظفين القانونية." },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const [filter, setFilter] = useState("");
  const { options: types, add: addType } = useOptionList("request-types", baseTypes);

  return (
    <PageShell
      title="الطلبات القانونية"
      description="طلبات الموظفين ومسار اعتمادها — إنشاء وتعديل وحذف."
    >
      <Panel title="مسار الاعتماد">
        <ol className="flex flex-wrap items-center gap-2">
          {workflow.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                {s}
              </span>
              {i < workflow.length - 1 ? <span className="text-muted-foreground">←</span> : null}
            </li>
          ))}
        </ol>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-4">
        <Panel title="أنواع الطلبات" className="lg:col-span-1">
          <TagList items={types} selected={filter} onSelect={setFilter} />
        </Panel>

        <CrudTable
          filters={{ type: filter }}
          className="lg:col-span-3"
          title="الطلبات الواردة"
          addLabel="طلب جديد"
          storageKey="requests"
          seed={requests}
          idKey="no"
          idPrefix="RQ-"
          fields={[
            { key: "no", label: "رقم الطلب", type: "mono", required: true },
            { key: "employee", label: "الموظف", required: true },
            {
              key: "type",
              label: "نوع الطلب",
              type: "select",
              options: types,
              onAddOption: addType,
              addLabel: "إضافة نوع جديد",
            },
            { key: "date", label: "التاريخ", type: "date" },
            { key: "stage", label: "المرحلة الحالية", type: "select", options: workflow },
            {
              key: "status",
              label: "الحالة",
              type: "status",
              options: ["جديد", "قيد المعالجة", "مكتمل", "مرفوض"],
            },
          ]}
        />
      </div>
    </PageShell>
  );
}
