import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, TagList } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
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

const statuses = [
  "متاحة",
  "مُسندة",
  "مُرجعة",
  "بانتظار الإرجاع",
  "مفقودة",
  "تالفة",
  "صيانة",
  "مستبعدة",
];

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
      description="إدارة أصول الشركة المسندة للموظفين — إسناد، تعديل، وحذف العهد."
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

        <CrudTable
          className="lg:col-span-3"
          title="سجل العهد"
          addLabel="إسناد عهدة"
          storageKey="assets"
          seed={assets}
          idKey="code"
          idPrefix="AST-"
          fields={[
            { key: "code", label: "كود الأصل", type: "mono", required: true },
            { key: "name", label: "الاسم", required: true },
            { key: "category", label: "الفئة", type: "select", options: categories },
            { key: "serial", label: "الرقم التسلسلي", type: "mono" },
            { key: "employee", label: "الموظف" },
            { key: "dept", label: "القسم" },
            { key: "assigned", label: "تاريخ الإسناد", type: "date" },
            { key: "expected", label: "الإرجاع المتوقع", type: "date" },
            {
              key: "condition",
              label: "الحالة الفنية",
              type: "select",
              options: ["ممتازة", "جيدة", "مقبولة", "تحتاج إصلاح", "—"],
            },
            { key: "status", label: "الحالة", type: "status", options: statuses },
          ]}
        />
      </div>
    </PageShell>
  );
}
