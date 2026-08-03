import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, DataTable, TagList } from "@/components/legal/PageShell";
import { CrudTable } from "@/components/legal/CrudTable";
import { BrandingSettings } from "@/components/legal/BrandingSettings";

import { roles, reminderSchedule } from "@/lib/legal-data";
import { useAuditLog } from "@/lib/audit";


const channels = ["إشعار داخل النظام", "بريد إلكتروني", "رسالة SMS", "واتساب (اختياري)", "إشعار تطبيق الجوال"];
const security = [
  "صلاحيات حسب الدور (RBAC)",
  "تشفير المستندات",
  "التوقيع الرقمي",
  "سجل الإصدارات",
  "علامة مائية",
  "تنزيل آمن للملفات",
  "سجل النشاطات",
  "نسخ احتياطي تلقائي",
  "التحقق بخطوتين (اختياري)",
];

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات والصلاحيات — نظام INT القانوني" },
      {
        name: "description",
        content: "إدارة أدوار المستخدمين وقنوات الإشعارات وجدول التذكيرات وسجل التدقيق.",
      },
      { property: "og:title", content: "الإعدادات والصلاحيات — نظام INT" },
      { property: "og:description", content: "الأدوار والصلاحيات والتذكيرات وسجل التدقيق." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageShell
      title="الإعدادات"
      description="الهوية البصرية، الأدوار والصلاحيات، قنوات الإشعارات، جدول التذكيرات، وسجل التدقيق."
    >
      <div className="mb-5">
        <BrandingSettings />
      </div>


      <div className="grid gap-5 lg:grid-cols-2">
        <CrudTable
          title="أدوار المستخدمين والصلاحيات"
          addLabel="دور جديد"
          storageKey="roles"
          seed={roles}
          idKey="role"
          idPrefix="دور "
          fields={[
            { key: "role", label: "الدور", required: true },
            { key: "perms", label: "الصلاحيات", required: true },
          ]}
        />


        <div className="space-y-5">
          <Panel title="جدول التذكيرات قبل الانتهاء">
            <div className="flex flex-wrap gap-2">
              {reminderSchedule.map((d) => (
                <span
                  key={d}
                  className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-[var(--accent-ink)]"
                >
                  {d} يوم
                </span>
              ))}
              <span className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive">
                عند الانتهاء
              </span>
            </div>
          </Panel>

          <Panel title="قنوات الإشعارات">
            <TagList items={channels} />
          </Panel>

          <Panel title="الأمان">
            <TagList items={security} />
          </Panel>
        </div>
      </div>

      <div className="mt-5">
        <Panel title="سجل التدقيق" subtitle="تسجيل كل نشاط داخل النظام">
          <DataTable
            columns={["الوقت", "المستخدم", "الإجراء", "العنصر", "عنوان IP"]}
            rows={auditLog.map((a) => [
              <span className="font-mono text-xs text-muted-foreground">{a.time}</span>,
              <span className="font-medium">{a.user}</span>,
              a.action,
              a.target,
              <span className="font-mono text-xs">{a.ip}</span>,
            ])}
          />
        </Panel>
      </div>
    </PageShell>
  );
}
