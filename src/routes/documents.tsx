import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, TagList } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { companyDocuments } from "@/lib/legal-data";

const categories = [
  "السجل التجاري",
  "البطاقة الضريبية",
  "شهادة ضريبة القيمة المضافة",
  "الغرفة التجارية",
  "رخصة استيراد",
  "رخصة تصدير",
  "بوالص التأمين",
  "شهادات العلامات التجارية",
  "سياسات الشركة",
  "عقود الإيجار",
  "التراخيص الحكومية",
  "نماذج عدم الإفصاح",
  "اتفاقيات الشراكة",
  "عقود الموردين",
  "عقود العملاء",
  "مستندات قانونية داخلية",
];

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

  return (
    <PageShell
      title="مستندات الشركة القانونية"
      description="حفظ وتتبع جميع المستندات الرسمية والتراخيص مع إضافة وتعديل وحذف السجلات."
    >
      <div className="grid gap-5 lg:grid-cols-4">
        <Panel title="التصنيفات" className="lg:col-span-1">
          <TagList items={categories} selected={filter} onSelect={setFilter} />
        </Panel>

        <CrudTable
          filters={{ category: filter }}
          className="lg:col-span-3"
          title="سجل المستندات"
          subtitle="رقم المستند، الجهة المُصدِرة، تواريخ الإصدار والانتهاء"
          addLabel="مستند جديد"
          storageKey="documents"
          seed={companyDocuments}
          idKey="no"
          idPrefix="DOC-"
          fields={[
            { key: "no", label: "رقم المستند", type: "mono", required: true },
            { key: "name", label: "الاسم", required: true },
            { key: "category", label: "التصنيف", type: "select", options: categories },
            { key: "authority", label: "الجهة المُصدِرة" },
            { key: "issue", label: "الإصدار", type: "date" },
            { key: "expiry", label: "الانتهاء", type: "date" },
            { key: "remind", label: "التذكير (يوم)", type: "number" },
            { key: "owner", label: "المسؤول" },
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
