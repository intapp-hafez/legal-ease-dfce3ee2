import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { PageShell, Panel } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { SearchSelect } from "@/components/legal/SearchSelect";
import { assets } from "@/lib/legal-data";
import { useCategories, useStatuses } from "@/lib/custody-options";

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
  const { options: categories, add: addCategory } = useCategories();
  const { options: statuses, add: addStatus } = useStatuses();

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
