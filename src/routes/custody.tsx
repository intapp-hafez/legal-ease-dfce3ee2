import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { PageShell, Panel } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { SearchSelect } from "@/components/legal/SearchSelect";
import { assets } from "@/lib/legal-data";


const baseCategories = [
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

const baseStatuses = [
  "متاحة",
  "مُسندة",
  "مُرجعة",
  "بانتظار الإرجاع",
  "مفقودة",
  "تالفة",
  "صيانة",
  "مستبعدة",
];

function useCustomOptions(key: string, base: string[]) {
  const [extra, setExtra] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setExtra(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [key]);
  const add = (v: string) => {
    setExtra((prev) => {
      if (base.includes(v) || prev.includes(v)) return prev;
      const next = [...prev, v];
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return { options: [...base, ...extra], add };
}


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
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { options: categories, add: addCategory } = useCustomOptions(
    "custody-extra-categories",
    baseCategories,
  );
  const { options: statuses, add: addStatus } = useCustomOptions(
    "custody-extra-statuses",
    baseStatuses,
  );
  const hasFilters = !!catFilter || !!statusFilter;

  return (
    <PageShell
      title="عهد الموظفين"
      description="إدارة أصول الشركة المسندة للموظفين — إسناد، تعديل، وحذف العهد."
    >
      <div className="space-y-5">
        <Panel title="تصفية العهد">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <SearchSelect
              label="فئة الأصل"
              allLabel="كل الفئات"
              value={catFilter}
              onChange={setCatFilter}
              options={categories}
              onAddOption={addCategory}
              addLabel="إضافة فئة جديدة"
            />
            <SearchSelect
              label="حالة العهدة"
              allLabel="كل الحالات"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statuses}
              onAddOption={addStatus}
              addLabel="إضافة حالة جديدة"
            />
            <div className="flex items-end">
              <button
                type="button"
                disabled={!hasFilters}
                onClick={() => {
                  setCatFilter("");
                  setStatusFilter("");
                }}
                className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm outline-none hover:bg-muted focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                تصفير الفلاتر
              </button>
            </div>
          </div>
        </Panel>


        <CrudTable
          filters={{ category: catFilter, status: statusFilter }}
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
