import { createFileRoute } from "@tanstack/react-router";
import { Upload, Download, Printer, Share2 } from "lucide-react";
import { PageShell, Panel, DataTable, StatusPill, TagList } from "@/components/legal/PageShell";
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
  return (
    <PageShell
      title="مستندات الشركة القانونية"
      description="حفظ وتتبع جميع المستندات الرسمية والتراخيص مع تنبيهات الانتهاء."
      actions={
        <>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            <Upload className="size-4" /> رفع مستند
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground">
            <Download className="size-4" /> تصدير
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground">
            <Printer className="size-4" /> طباعة
          </button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-4">
        <Panel title="التصنيفات" className="lg:col-span-1">
          <TagList items={categories} />
        </Panel>

        <Panel
          title="سجل المستندات"
          subtitle="رقم المستند، الجهة المُصدِرة، تواريخ الإصدار والانتهاء"
          className="lg:col-span-3"
          action={
            <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Share2 className="size-3.5" /> مشاركة
            </button>
          }
        >
          <DataTable
            columns={[
              "رقم المستند",
              "الاسم",
              "التصنيف",
              "الجهة المُصدِرة",
              "الإصدار",
              "الانتهاء",
              "التذكير",
              "المسؤول",
              "الحالة",
            ]}
            rows={companyDocuments.map((d) => [
              <span className="font-mono text-xs text-muted-foreground">{d.no}</span>,
              <span className="font-medium">{d.name}</span>,
              d.category,
              d.authority,
              d.issue,
              d.expiry,
              `${d.remind} يوم`,
              d.owner,
              <StatusPill value={d.status} />,
            ])}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
