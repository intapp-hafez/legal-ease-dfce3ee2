import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, TagList } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
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
      description="هيكل مجلدات موحد لجميع الملفات القانونية — إضافة وتعديل وحذف المجلدات."
    >
      <div className="grid gap-5 lg:grid-cols-4">
        <Panel title="خصائص المستودع" className="lg:col-span-1">
          <TagList items={features} />
        </Panel>

        <CrudTable
          className="lg:col-span-3"
          title="مجلدات المستودع"
          addLabel="مجلد جديد"
          storageKey="repository"
          seed={repository}
          idKey="folder"
          idPrefix="مجلد "
          fields={[
            { key: "folder", label: "المجلد", required: true },
            { key: "files", label: "عدد الملفات", type: "number" },
            { key: "size", label: "الحجم" },
            { key: "updated", label: "آخر تحديث", type: "date" },
          ]}
        />
      </div>
    </PageShell>
  );
}
