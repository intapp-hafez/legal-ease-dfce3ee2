import { createFileRoute } from "@tanstack/react-router";
import { Plus, QrCode } from "lucide-react";
import { PageShell, Panel, DataTable, StatusPill, TagList } from "@/components/legal/PageShell";
import { assets } from "@/lib/legal-data";

const categories = [
  "لابتوب",
  "جهاز مكتبي",
  "شاشة",
  "هاتف محمول",
  "تابلت",
  "شريحة اتصال",
  "طابعة",
  "ماسح ضوئي",
  "مركبة",
  "مفاتيح مكتب",
  "بطاقة دخول",
  "راوتر",
  "سماعة رأس",
  "بطارية متنقلة",
  "توكن USB",
  "مفتاح أمان",
  "معدات أخرى",
];

const statuses = ["متاحة", "مُسندة", "مُرجعة", "مفقودة", "تالفة", "صيانة", "مستبعدة"];

export const Route = createFileRoute("/custody")({
  head: () => ({
    meta: [
      { title: "عهد الموظفين — نظام INT القانوني" },
      {
        name: "description",
        content: "تسجيل أصول الشركة المسندة للموظفين وحالتها وتواريخ التسليم والإرجاع.",
      },
      { property: "og:title", content: "عهد الموظفين — نظام INT" },
      { property: "og:description", content: "تتبع دقيق لأصول الشركة المسندة للموظفين." },
    ],
  }),
  component: CustodyPage,
});

function CustodyPage() {
  return (
    <PageShell
      title="عهد الموظفين"
      description="إدارة أصول الشركة المسندة للموظفين مع توقيعات الاستلام والإرجاع."
      actions={
        <>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="size-4" /> إسناد عهدة
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground">
            <QrCode className="size-4" /> رمز QR
          </button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">
        <div className="space-y-5 lg:col-span-1">
          <Panel title="فئات الأصول">
            <TagList items={categories} />
          </Panel>
          <Panel title="حالات العهدة">
            <TagList items={statuses} />
          </Panel>
        </div>

        <Panel title="سجل العهد" className="lg:col-span-3">
          <DataTable
            columns={[
              "كود الأصل",
              "الاسم",
              "الفئة",
              "الرقم التسلسلي",
              "الموظف",
              "القسم",
              "تاريخ الإسناد",
              "الإرجاع المتوقع",
              "الحالة الفنية",
              "الحالة",
            ]}
            rows={assets.map((a) => [
              <span className="font-mono text-xs text-muted-foreground">{a.code}</span>,
              <span className="font-medium">{a.name}</span>,
              a.category,
              <span className="font-mono text-xs">{a.serial}</span>,
              a.employee,
              a.dept,
              a.assigned,
              a.expected,
              a.condition,
              <StatusPill value={a.status} />,
            ])}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
