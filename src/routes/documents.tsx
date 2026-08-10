import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { PageShell, Panel } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { SearchSelect } from "@/components/legal/SearchSelect";
import { useDocumentCategories } from "@/lib/document-categories";
import { useProfilesOptions } from "@/lib/useSupabase";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "مستندات الشركة القانونية — نظام INT القانوني" },
      {
        name: "description",
        content: "أرشفة السجل التجاري والتراخيص والبوالص مع تتبع تواريخ الانتهاء والتذكيرات.",
      },
      { property: "og:title", content: "مستندات الشركة القانونية — نظام INT" },
      {
        property: "og:description",
        content: "أرشفة التراخيص والمستندات الرسمية وتتبع انتهائها.",
      },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const [filter, setFilter] = useState("");
  const { options: categories, add: addCategory } = useDocumentCategories();
  const profilesOptions = useProfilesOptions();

  return (
    <PageShell
      title="مستندات الشركة القانونية"
      description="حفظ وتتبع جميع المستندات الرسمية والتراخيص مع إضافة وتعديل وحذف السجلات."
    >
      <div className="space-y-5">
        <Panel title="تصفية المستندات">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <SearchSelect
              label="التصنيف"
              allLabel="كل التصنيفات"
              value={filter}
              onChange={setFilter}
              options={categories}
              onAddOption={addCategory}
              addLabel="إضافة تصنيف جديد"
            />
            <div className="flex items-end">
              <button
                type="button"
                disabled={!filter}
                onClick={() => setFilter("")}
                className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm outline-none hover:bg-muted focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                تصفير التصفية
              </button>
            </div>
          </div>
        </Panel>

        <CrudTable
          filters={{ category: filter }}
          title="سجل المستندات"
          subtitle="رقم المستند، الجهة المُصدِرة، تواريخ الإصدار والانتهاء"
          addLabel="مستند جديد"
          storageKey="documents"
          tableName="documents"
          seed={[]}
          idKey="no"
          idPrefix="DOC-"
          fields={[
            { key: "no", label: "رقم المستند", type: "mono", required: true },
            { key: "name", label: "الاسم", required: true },
            {
              key: "category",
              label: "التصنيف",
              type: "select",
              options: categories,
              onAddOption: addCategory,
              addLabel: "إضافة تصنيف جديد",
              required: true,
            },
            { key: "authority", label: "الجهة المُصدِرة" },
            { key: "issue_date", label: "الإصدار", type: "date" },
            { key: "expiry_date", label: "الانتهاء", type: "date" },
            { key: "remind_days", label: "التذكير (يوم)", type: "number" },
            { key: "owner_id", label: "المسؤول", type: "select", options: profilesOptions },
            {
              key: "status",
              label: "الحالة",
              type: "status",
              options: ["نشط", "منتهي", "مؤرشف", "قيد المراجعة"],
            },
          ]}
        />
      </div>
    </PageShell>
  );
}
