import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, TagList } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { useOptionList } from "@/lib/option-lists";
import { useProfilesOptions } from "@/lib/useSupabase";
import { EmployeeCell } from "@/components/legal/EmployeeCell";

const baseTypes = [
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
  const [filter, setFilter] = useState("");
  const { options: types, add: addType } = useOptionList("violation-types", baseTypes);
  const profilesOptions = useProfilesOptions();

  return (
    <PageShell
      title="مخالفات الموظفين"
      description="توثيق المخالفات التأديبية والقرارات — تسجيل وتعديل وحذف."
    >
      <div className="grid gap-5 lg:grid-cols-4">
        <Panel title="أنواع المخالفات" className="lg:col-span-1">
          <TagList items={types} selected={filter} onSelect={setFilter} />
        </Panel>

        <CrudTable
          filters={{ type: filter }}
          className="lg:col-span-3"
          title="السجل التأديبي"
          addLabel="تسجيل مخالفة"
          storageKey="violations"
          tableName="violations"
          seed={[]}
          idKey="no"
          idPrefix="VL-"
          fields={[
            { key: "no", label: "الرقم", type: "mono", required: true },
            {
              key: "employee_id",
              label: "الموظف",
              type: "select",
              options: profilesOptions,
              required: true,
              render: (val: any) => <EmployeeCell employeeId={val} />,
            },
            {
              key: "type",
              label: "نوع المخالفة",
              type: "select",
              options: types,
              onAddOption: addType,
              addLabel: "إضافة نوع جديد",
            },
            { key: "violation_date", label: "التاريخ", type: "date" },
            { key: "decision", label: "القرار" },
            {
              key: "status",
              label: "الحالة",
              type: "status",
              options: ["مفتوحة", "قيد التحقيق", "مغلقة"],
            },
          ]}
        />
      </div>
    </PageShell>
  );
}
