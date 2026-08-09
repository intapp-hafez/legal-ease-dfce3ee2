import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
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
      description="متابعة القضايا المرفوعة من الشركة أو ضدها — إضافة وتعديل وحذف."
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

      <CrudTable
        title="سجل القضايا"
        addLabel="قضية جديدة"
        storageKey="cases"
        seed={cases}
        idKey="no"
        idPrefix="CS-"
        fields={[
          { key: "no", label: "رقم القضية", type: "mono", required: true },
          { key: "name", label: "الاسم", required: true },
          {
            key: "type",
            label: "النوع",
            type: "select",
            options: ["تجاري", "عمالي", "مدني", "جنائي", "إداري", "ملكية فكرية"],
          },
          { key: "opponent", label: "الخصم" },
          { key: "court", label: "المحكمة" },
          { key: "firm", label: "مكتب المحاماة" },
          { key: "lawyer", label: "المحامي" },
          { key: "start", label: "البداية", type: "date" },
          { key: "hearing", label: "الجلسة القادمة", type: "date" },
          { key: "value", label: "القيمة" },
          {
            key: "priority",
            label: "الأولوية",
            type: "select",
            options: ["منخفضة", "متوسطة", "عالية", "عاجلة"],
          },
          {
            key: "status",
            label: "الحالة",
            type: "status",
            options: ["مفتوحة", "قيد التحقيق", "أمام المحكمة", "مغلقة", "مؤرشف"],
          },
        ]}
      />
    </PageShell>
  );
}
