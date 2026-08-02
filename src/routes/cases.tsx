import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageShell, Panel, DataTable, StatusPill } from "@/components/legal/PageShell";
import { cases } from "@/lib/legal-data";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: "القضايا القانونية — نظام INT القانوني" },
      {
        name: "description",
        content: "متابعة القضايا والمحاكم والجلسات القادمة والقيمة المالية لكل قضية.",
      },
      { property: "og:title", content: "القضايا القانونية — نظام INT" },
      { property: "og:description", content: "متابعة القضايا والجلسات والمحامين المكلّفين." },
    ],
  }),
  component: CasesPage,
});

function CasesPage() {
  return (
    <PageShell
      title="القضايا القانونية"
      description="متابعة القضايا المرفوعة من الشركة أو ضدها حتى الإغلاق والأرشفة."
      actions={
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="size-4" /> قضية جديدة
        </button>
      }
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "قضايا مفتوحة", value: 7 },
          { label: "أمام المحكمة", value: 3 },
          { label: "جلسات هذا الشهر", value: 2 },
          { label: "إجمالي القيمة المالية", value: "630,000" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="font-display text-2xl font-bold text-card-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Panel title="سجل القضايا">
        <DataTable
          columns={[
            "رقم القضية",
            "الاسم",
            "النوع",
            "الخصم",
            "المحكمة",
            "مكتب المحاماة",
            "المحامي",
            "البداية",
            "الجلسة القادمة",
            "القيمة",
            "الأولوية",
            "الحالة",
          ]}
          rows={cases.map((c) => [
            <span className="font-mono text-xs text-muted-foreground">{c.no}</span>,
            <span className="font-medium">{c.name}</span>,
            c.type,
            c.opponent,
            c.court,
            c.firm,
            c.lawyer,
            c.start,
            c.hearing,
            c.value,
            c.priority,
            <StatusPill value={c.status} />,
          ])}
        />
      </Panel>
    </PageShell>
  );
}
