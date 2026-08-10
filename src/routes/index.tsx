import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  FileCheck2,
  Clock,
  FileX2,
  PenLine,
  Package,
  Undo2,
  Folder,
  BadgeAlert,
  Gavel,
  ListChecks,
  AlarmClock,
  CalendarDays,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "@/lib/auth";
import { EmployeeDashboard } from "@/components/legal/EmployeeDashboard";

import { PageShell, Panel, StatusPill } from "@/components/legal/PageShell";
import { useAdminDashboard } from "@/hooks/useDashboard";
import { repository, contractsByMonth } from "@/lib/legal-data";
import { useNotifications } from "@/lib/useNotifications";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة المعلومات — نظام INT القانوني" },
      {
        name: "description",
        content: "مؤشرات فورية للعقود والمستندات والعهد والمهام والقضايا القانونية.",
      },
      { property: "og:title", content: "لوحة المعلومات — نظام INT القانوني" },
      {
        property: "og:description",
        content: "مؤشرات فورية للعقود والمستندات والعهد والمهام القانونية.",
      },
    ],
  }),
  component: Dashboard,
});

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  fileCheck: FileCheck2,
  clock: Clock,
  fileX: FileX2,
  penLine: PenLine,
  package: Package,
  undo: Undo2,
  folder: Folder,
  badgeAlert: BadgeAlert,
  gavel: Gavel,
  listChecks: ListChecks,
  alarmClock: AlarmClock,
};

const toneClass: Record<string, string> = {
  default: "bg-primary/15 text-[var(--primary-ink)]",
  success: "bg-success/20 text-success",
  warning: "bg-warning/25 text-[var(--warning-ink)]",
  danger: "bg-destructive/18 text-destructive",
};

const cardTone: Record<string, string> = {
  default: "border-primary/25 bg-primary/8",
  success: "border-success/25 bg-success/10",
  warning: "border-warning/30 bg-warning/12",
  danger: "border-destructive/25 bg-destructive/8",
};

const valueTone: Record<string, string> = {
  default: "text-[var(--primary-ink)]",
  success: "text-success",
  warning: "text-[var(--warning-ink)]",
  danger: "text-destructive",
};

const chartColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

// The total and gradients will be computed inside the component now

function AdminDashboard() {
  const { data, isLoading, isError, error } = useAdminDashboard();
  const { notifications: liveNotifications, markAsRead } = useNotifications();
  
  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <PageShell title="لوحة المعلومات" description="جاري التحميل...">
        <div className="flex h-64 items-center justify-center">
          <span className="text-muted-foreground">جاري جلب البيانات...</span>
        </div>
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell title="لوحة المعلومات" description="حدث خطأ">
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <span className="text-destructive font-semibold">تعذر تحميل لوحة المعلومات</span>
          <pre className="text-xs text-muted-foreground max-w-lg whitespace-pre-wrap">
            {error?.message || "بيانات غير متوفرة"}
          </pre>
        </div>
      </PageShell>
    );
  }

  const {
    totalProfiles,
    activeContracts,
    totalAssets,
    openCases,
    todayTasks: countTodayTasks,
    lateTasks,
    recentActivities,
    upcomingExpirations,
    tasksList,
    assetsByCategory,
  } = data!;

  const dynamicKpis = [
    { label: "إجمالي الموظفين", value: totalProfiles, icon: "users", tone: "default" },
    { label: "العقود النشطة", value: activeContracts, icon: "fileCheck", tone: "success" },
    { label: "عقود مسندة", value: activeContracts, icon: "penLine", tone: "warning" },
    { label: "إجمالي العهد", value: totalAssets, icon: "package", tone: "default" },
    { label: "قضايا مفتوحة", value: openCases, icon: "gavel", tone: "default" },
    { label: "مهام جديدة", value: countTodayTasks, icon: "listChecks", tone: "success" },
    { label: "مهام متأخرة", value: lateTasks, icon: "alarmClock", tone: "danger" },
  ] as const;

  const totalAssetsCount = assetsByCategory.reduce((s: number, a: any) => s + a.value, 0);
  let acc = 0;
  const donutGradientStyle = `conic-gradient(${assetsByCategory.map((a: any, i: number) => {
    const start = (acc / (totalAssetsCount || 1)) * 360;
    acc += a.value;
    const end = (acc / (totalAssetsCount || 1)) * 360;
    return `${chartColors[i % chartColors.length]} ${start}deg ${end}deg`;
  }).join(", ")})`;

  return (
    <PageShell
      title="لوحة المعلومات"
      description={`نظرة شاملة على الوضع القانوني للشركة — ${today}`}
      actions={
        <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <CalendarDays className="size-4" />
          الفترة: الشهر الحالي
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {dynamicKpis.map((k) => {
          const Icon = icons[k.icon] ?? Users;
          return (
            <div
              key={k.label}
              className={`rounded-xl border p-4 shadow-[var(--shadow-panel)] transition-colors ${cardTone[k.tone] ?? cardTone['default']}`}
            >
              <span
                className={`mb-3 inline-flex size-9 items-center justify-center rounded-lg ${toneClass[k.tone]}`}
              >
                <Icon className="size-4" />
              </span>
              <p className={`font-display text-2xl font-bold ${valueTone[k.tone] ?? valueTone['default']}`}>{k.value}</p>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel
          title="حركة العقود خلال العام"
          subtitle="عقود جديدة مقابل عقود مجددة"
          className="lg:col-span-2"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="جديدة" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="مجددة" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="توزيع العهد حسب الفئة">
          <div className="flex h-[240px] items-center justify-center">
            <div
              className="relative size-[200px] rounded-full"
              style={{ background: donutGradientStyle }}
            >
              <div className="absolute inset-[26%] flex flex-col items-center justify-center rounded-full bg-card">
                <span className="font-display text-2xl font-bold text-card-foreground">
                  {totalAssetsCount}
                </span>
                <span className="text-xs text-muted-foreground">إجمالي العهد</span>
              </div>
            </div>
          </div>

          <ul className="mt-2 space-y-1.5">
            {assetsByCategory.map((a: any, i: number) => (
              <li key={a.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: chartColors[i % chartColors.length] }}
                  />
                  {a.name}
                </span>
                <span className="font-medium text-foreground">{a.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="انتهاءات قادمة" subtitle="تذكيرات 90 / 60 / 30 / 15 / 7 أيام">
          <ul className="space-y-3">
            {upcomingExpirations.length === 0 ? (
              <li className="text-xs text-muted-foreground">لا توجد انتهاءات قادمة.</li>
            ) : null}
            {upcomingExpirations.map((e: any) => (
              <li key={e.name} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.type} — {e.date}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    e.days <= 30
                      ? "border-destructive/25 bg-destructive/10 text-destructive"
                      : "border-warning/30 bg-warning/12 text-[var(--warning-ink)]"
                  }`}
                >
                  {e.days} يوم
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="مهام اليوم">
          <ul className="space-y-3.5">
            {tasksList.length === 0 ? (
              <li className="text-xs text-muted-foreground">لا توجد مهام حالياً.</li>
            ) : null}
            {tasksList.map((t: any) => (
              <li key={t.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  <StatusPill value={t.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.no} — أولوية {t.priority}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${t.progress || 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="الإشعارات (مباشر)">
          <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {liveNotifications.length === 0 ? (
              <li className="text-sm text-muted-foreground">لا توجد إشعارات.</li>
            ) : null}
            {liveNotifications.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 flex justify-between items-start"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    تعيين كمقروء
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="آخر الأنشطة" subtitle="سجل التدقيق المختصر">
          <ul className="space-y-3">
            {recentActivities.length === 0 ? (
              <li className="text-xs text-muted-foreground">لا يوجد نشاط حديث.</li>
            ) : null}
            {recentActivities.map((a: any, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{a.user}</span> — {a.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="مستندات مرفوعة حديثًا">
          <ul className="grid gap-2 sm:grid-cols-2">
            {repository.slice(0, 6).map((r) => (
              <li
                key={r.folder}
                className="rounded-lg border border-border px-3 py-2.5 text-sm"
              >
                <p className="font-medium text-foreground">{r.folder}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {r.files} ملف — آخر تحديث {r.updated}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}

function Dashboard() {
  const { user } = useAuth();
  
  if (user?.role === "employee") {
    return <EmployeeDashboard />;
  }
  
  return <AdminDashboard />;
}
