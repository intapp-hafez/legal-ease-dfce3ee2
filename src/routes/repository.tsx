import { createFileRoute } from "@tanstack/react-router";
import { Folder, Search, Upload } from "lucide-react";
import { PageShell, Panel, DataTable, TagList } from "@/components/legal/PageShell";
import { repository } from "@/lib/legal-data";

const features = [
  "إدارة الإصدارات",
  "بحث OCR",
  "بحث في النص الكامل",
  "وسوم",
  "تصنيفات",
  "معاينة",
  "تنزيل",
  "التحكم في الصلاحيات",
];

export const Route = createFileRoute("/repository")({
  head: () => ({
    meta: [
      { title: "مستودع المستندات — نظام INT القانوني" },
      {
        name: "description",
        content: "تخزين مركزي منظم لجميع الملفات القانونية مع إدارة الإصدارات والصلاحيات.",
      },
      { property: "og:title", content: "مستودع المستندات — نظام INT" },
      { property: "og:description", content: "تخزين مركزي وبحث كامل في الملفات القانونية." },
    ],
  }),
  component: RepositoryPage,
});

function RepositoryPage() {
  return (
    <PageShell
      title="مستودع المستندات"
      description="هيكل مجلدات موحد لجميع الملفات القانونية مع إدارة إصدارات وصلاحيات."
      actions={
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Upload className="size-4" /> رفع ملف
        </button>
      }
    >
      <div className="mb-5 relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-11 w-full rounded-lg border border-border bg-card pr-9 pl-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
          placeholder="بحث في محتوى الملفات (OCR والنص الكامل)…"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {repository.map((r) => (
          <div
            key={r.folder}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-panel)] transition-colors hover:border-accent/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
              <Folder className="size-5" />
            </span>
            <div>
              <p className="font-medium text-card-foreground">{r.folder}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.files} ملف — {r.size}
              </p>
              <p className="text-xs text-muted-foreground">آخر تحديث: {r.updated}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="خصائص المستودع" className="lg:col-span-1">
          <TagList items={features} />
        </Panel>
        <Panel title="أحدث الإصدارات" className="lg:col-span-2">
          <DataTable
            columns={["المجلد", "عدد الملفات", "الحجم", "آخر تحديث"]}
            rows={repository.slice(0, 6).map((r) => [
              <span className="font-medium">{r.folder}</span>,
              r.files,
              r.size,
              r.updated,
            ])}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
