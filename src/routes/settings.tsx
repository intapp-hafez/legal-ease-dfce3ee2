import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Panel, DataTable } from "@/components/legal/PageShell";
import { BrandingSettings } from "@/components/legal/BrandingSettings";
import { AccessControl } from "@/components/legal/AccessControl";
import { CustodyOptionsSettings } from "@/components/legal/CustodyOptionsSettings";
import { DocumentCategoriesSettings } from "@/components/legal/DocumentCategoriesSettings";
import {
  ReminderScheduleSettings,
  NotificationChannelsSettings,
  SecurityFeaturesSettings,
} from "@/components/legal/DynamicSettingsPanels";
import { SystemNotificationsManager } from "@/components/legal/SystemNotificationsManager";
import { NotificationRulesSettings } from "@/components/legal/NotificationRulesSettings";
import { StorageSettings } from "@/components/legal/StorageSettings";
import { useAuditLog } from "@/lib/audit";

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
  const { entries: auditEntries, clear: clearAudit } = useAuditLog();
  return (
    <PageShell
      title="الإعدادات"
      description="الهوية البصرية، الأدوار والصلاحيات، قنوات الإشعارات، جدول التذكيرات، وسجل التدقيق."
    >
      <div className="mb-5">
        <AccessControl />
      </div>

      <div className="mb-5">
        <NotificationRulesSettings />
      </div>

      <div className="mb-5">
        <SystemNotificationsManager />
      </div>

      <div className="mb-5">
        <BrandingSettings />
      </div>

      <div className="mb-5">
        <StorageSettings />
      </div>

      <div className="mb-5">
        <CustodyOptionsSettings />
      </div>

      <div className="mb-5">
        <DocumentCategoriesSettings />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 mb-5">
        <div className="space-y-5">
          <ReminderScheduleSettings />
          <NotificationChannelsSettings />
        </div>
        <div className="space-y-5">
          <SecurityFeaturesSettings />
        </div>
      </div>

      <div className="mt-5">
        <Panel
          title="سجل التدقيق"
          subtitle="تسجيل كل نشاط داخل النظام — بما في ذلك عمليات الاستيراد من Excel"
          action={
            <button
              onClick={clearAudit}
              className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
            >
              تفريغ السجل
            </button>
          }
        >
          <DataTable
            columns={["الوقت", "المستخدم", "الإجراء", "العنصر", "النتيجة", "عنوان IP"]}
            rows={auditEntries.map((a) => [
              <span className="font-mono text-xs text-muted-foreground">{a.time}</span>,
              <span className="font-medium">{a.user}</span>,
              a.action,
              a.target,
              <span className="text-xs text-muted-foreground">{a.details ?? "—"}</span>,
              <span className="font-mono text-xs">{a.ip}</span>,
            ])}
          />
        </Panel>
      </div>

    </PageShell>
  );
}
