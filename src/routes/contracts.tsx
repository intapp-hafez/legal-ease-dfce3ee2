import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, TagList } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { contracts, contractWorkflow } from "@/lib/legal-data";
import { useOptionList } from "@/lib/option-lists";

const baseTypes = [
  "عقد عمل",
  "تجديد عقد",
  "عقد مؤقت",
  "عقد تحت التجربة",
  "عقد ترقية",
  "تعديل راتب",
  "اتفاقية عمل عن بعد",
  "اتفاقية عدم إفصاح",
  "اتفاقية إنهاء خدمة",
];

export const Route = createFileRoute("/contracts")({
  head: () => ({
    meta: [
      { title: "عقود الموظفين — نظام INT القانوني" },
      {
        name: "description",
        content: "إدارة عقود الموظفين وأنواعها ودورة اعتمادها وتواريخ بدايتها وانتهائها.",
      },
      { property: "og:title", content: "عقود الموظفين — نظام INT" },
      { property: "og:description", content: "دورة حياة العقد من المسودة حتى التجديد." },
    ],
  }),
  component: ContractsPage,
});

function ContractsPage() {
  const [filter, setFilter] = useState("");
  const { options: types, add: addType } = useOptionList("contract-types", baseTypes);

  return (
    <PageShell
      title="عقود الموظفين"
      description="كل موظف يمكن أن يمتلك عدة عقود — مع إضافة وتعديل وحذف كامل للسجلات."
    >
      <Panel title="دورة حياة العقد">
        <ol className="flex flex-wrap items-center gap-2">
          {contractWorkflow.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                {s}
              </span>
              {i < contractWorkflow.length - 1 ? (
                <span className="text-muted-foreground">←</span>
              ) : null}
            </li>
          ))}
        </ol>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-4">
        <Panel title="أنواع العقود" className="lg:col-span-1">
          <TagList items={types} selected={filter} onSelect={setFilter} />
        </Panel>

        <CrudTable
          filters={{ type: filter }}
          className="lg:col-span-3"
          title="سجل العقود"
          addLabel="عقد جديد"
          storageKey="contracts"
          seed={contracts}
          idKey="no"
          idPrefix="CT-"
          fields={[
            { key: "no", label: "رقم العقد", type: "mono", required: true },
            { key: "employee", label: "الموظف", required: true },
            { key: "code", label: "الكود" },
            { key: "dept", label: "القسم" },
            { key: "position", label: "المسمى" },
            {
              key: "type",
              label: "النوع",
              type: "select",
              options: types,
              onAddOption: addType,
              addLabel: "إضافة نوع جديد",
            },
            { key: "start", label: "البداية", type: "date" },
            { key: "end", label: "النهاية", type: "date" },
            { key: "salary", label: "الراتب" },
            { key: "status", label: "الحالة", type: "status", options: contractWorkflow },
          ]}
        />
      </div>
    </PageShell>
  );
}
