import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, TagList } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { contractWorkflow } from "@/lib/legal-data";
import { useOptionList } from "@/lib/option-lists";
import { useProfilesOptions } from "@/lib/useSupabase";

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
  const profilesOptions = useProfilesOptions();

  return (
    <PageShell
      title="عقود الموظفين"
      description="كل موظف يمكن أن يمتلك عدة عقود توظيف — مع إضافة وتعديل وحذف كامل للسجلات."
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

      <div className="mt-5 grid gap-5 lg:grid-cols-1">
        <CrudTable
          filters={{ type: "توظيف" }}
          className="lg:col-span-1"
          title="سجل العقود"
          addLabel="عقد توظيف جديد"
          storageKey="contracts"
          tableName="contracts"
          seed={[{ type: "توظيف" }]}
          idKey="no"
          idPrefix="CT-"
          fields={[
            { key: "no", label: "رقم العقد", type: "mono", required: true },
            { key: "employee_id", label: "الموظف", type: "select", options: profilesOptions, required: true },
            { key: "type", label: "النوع", type: "select", options: ["توظيف"], hideInForm: true },
            { key: "start_date", label: "البداية", type: "date" },
            { key: "end_date", label: "النهاية", type: "date" },
            { key: "salary", label: "الراتب", type: "number" },
            { key: "status", label: "الحالة", type: "status", options: contractWorkflow },
          ]}
        />
      </div>
    </PageShell>
  );
}
