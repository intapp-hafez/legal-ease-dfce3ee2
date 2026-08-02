import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, DataTable, StatusPill, TagList } from "@/components/legal/PageShell";
import { requests } from "@/lib/legal-data";

const types = [
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
  return (
    <PageShell
      title="الطلبات القانونية"
      description="طلبات الموظفين ومسار اعتمادها عبر المدير والموارد البشرية والمستشار القانوني."
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
          <TagList items={types} />
        </Panel>

        <Panel title="الطلبات الواردة" className="lg:col-span-3">
          <DataTable
            columns={["رقم الطلب", "الموظف", "نوع الطلب", "التاريخ", "المرحلة الحالية", "الحالة"]}
            rows={requests.map((r) => [
              <span className="font-mono text-xs text-muted-foreground">{r.no}</span>,
              <span className="font-medium">{r.employee}</span>,
              r.type,
              r.date,
              r.stage,
              <StatusPill value={r.status} />,
            ])}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
