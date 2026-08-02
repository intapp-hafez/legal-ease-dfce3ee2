import { createFileRoute } from "@tanstack/react-router";
import { Plus, Download } from "lucide-react";
import { PageShell, Panel, DataTable, StatusPill, TagList } from "@/components/legal/PageShell";
import { contracts, contractWorkflow } from "@/lib/legal-data";

const types = [
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
  return (
    <PageShell
      title="عقود الموظفين"
      description="كل موظف يمكن أن يمتلك عدة عقود — مع تتبع كامل لدورة الاعتماد والتوقيع."
      actions={
        <>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="size-4" /> عقد جديد
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground">
            <Download className="size-4" /> تصدير
          </button>
        </>
      }
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
          <TagList items={types} />
        </Panel>

        <Panel title="سجل العقود" className="lg:col-span-3">
          <DataTable
            columns={[
              "رقم العقد",
              "الموظف",
              "الكود",
              "القسم",
              "المسمى",
              "النوع",
              "البداية",
              "النهاية",
              "الراتب",
              "الحالة",
            ]}
            rows={contracts.map((c) => [
              <span className="font-mono text-xs text-muted-foreground">{c.no}</span>,
              <span className="font-medium">{c.employee}</span>,
              c.code,
              c.dept,
              c.position,
              c.type,
              c.start,
              c.end,
              c.salary,
              <StatusPill value={c.status} />,
            ])}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
