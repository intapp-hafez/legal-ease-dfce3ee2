import { useState } from "react";
import { Plus, X, RotateCcw, Bell, Shield, CalendarClock, AlertCircle } from "lucide-react";
import { Panel } from "@/components/legal/PageShell";
import { useOptionList } from "@/lib/option-lists";
import { reminderSchedule } from "@/lib/legal-data";

// ── Default Data ──
const defaultReminderDays = ["90", "60", "30", "15", "7", "1", "0"];
const defaultChannels = [
  "إشعار داخل النظام",
  "بريد إلكتروني",
  "رسالة SMS",
  "واتساب (اختياري)",
  "إشعار تطبيق الجوال",
];
const defaultSecurity = [
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

/**
 * Interactive Tag/Badge Manager with Add and Delete capabilities.
 */
function DynamicTagManager({
  title,
  subtitle,
  icon: Icon,
  dbKey,
  defaults,
  placeholder,
  renderItem,
  validateInput,
  transformInput,
  accentColor = "primary",
}: {
  title: string;
  subtitle?: string | undefined;
  icon?: any;
  dbKey: string;
  defaults: string[];
  placeholder: string;
  renderItem?: (item: string) => { label: string; isSpecial?: boolean };
  validateInput?: (val: string) => string | null;
  transformInput?: (val: string) => string;
  accentColor?: "primary" | "accent" | "warning";
}) {
  const api = useOptionList(dbKey, defaults);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    let trimmed = draft.trim();
    if (!trimmed) return;
    if (transformInput) {
      trimmed = transformInput(trimmed);
    }
    if (validateInput) {
      const vErr = validateInput(trimmed);
      if (vErr) {
        setError(vErr);
        return;
      }
    }
    const err = api.add(trimmed);
    if (err) {
      setError(err);
    } else {
      setDraft("");
      setError(null);
    }
  };

  return (
    <Panel
      title={title}
      subtitle={subtitle}
      action={
        <button
          type="button"
          onClick={() => {
            api.reset();
            setError(null);
          }}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="استعادة القيم الافتراضية"
        >
          <RotateCcw className="size-3.5" />
          استعادة الافتراضي
        </button>
      }
    >
      <div className="space-y-4">
        {/* Pills container */}
        <div className="flex flex-wrap items-center gap-2">
          {api.options.map((item) => {
            const parsed = renderItem ? renderItem(item) : { label: item, isSpecial: false };
            return (
              <span
                key={item}
                className={`group inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  parsed.isSpecial
                    ? "border-destructive/30 bg-destructive/10 text-destructive shadow-xs"
                    : "border-border bg-secondary/80 text-foreground hover:border-primary/40 hover:bg-secondary"
                }`}
              >
                <span>{parsed.label}</span>
                <button
                  type="button"
                  onClick={() => api.remove(item)}
                  className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                  title={`حذف "${parsed.label}"`}
                  aria-label={`حذف ${parsed.label}`}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            );
          })}

          {api.options.length === 0 && (
            <span className="text-xs text-muted-foreground py-1">لا توجد عناصر، يمكنك إضافة عنصر جديد أدناه.</span>
          )}
        </div>

        {/* Add Input */}
        <div className="pt-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder={placeholder}
              className="h-8.5 max-w-xs flex-1 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!draft.trim()}
              className="flex h-8.5 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Plus className="size-3.5" />
              إضافة
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

/**
 * 1. Dynamic Reminder Schedule Manager (e.g. 90, 60, 30, 15, 7, 1 days + At Expiry)
 */
export function ReminderScheduleSettings() {
  return (
    <DynamicTagManager
      title="جدول التذكيرات قبل الانتهاء"
      subtitle="إدارة فترات إرسال التنبيهات قبل انتهاء العقود والمستندات بالأيام"
      dbKey="reminder-schedule"
      defaults={defaultReminderDays}
      placeholder="أدخل عدد الأيام (مثلاً: 45 أو 0 عند الانتهاء)..."
      transformInput={(val) => {
        const t = val.trim();
        if (t === "عند الانتهاء" || t === "0") return "0";
        const digits = t.replace(/[^0-9]/g, "");
        return digits || t;
      }}
      validateInput={(val) => {
        if (val === "0" || val === "عند الانتهاء") return null;
        const num = parseInt(val, 10);
        if (isNaN(num) || num <= 0) return "الرجاء إدخال رقم صحيح للأيام (أكبر من 0).";
        return null;
      }}
      renderItem={(item) => {
        const num = parseInt(item, 10);
        if (isNaN(num) || num === 0 || item === "عند الانتهاء" || item === "0") {
          return { label: "عند الانتهاء", isSpecial: true };
        }
        return { label: `${num} يوم`, isSpecial: false };
      }}
    />
  );
}

/**
 * 2. Dynamic Notification Channels Manager
 */
export function NotificationChannelsSettings() {
  return (
    <DynamicTagManager
      title="قنوات الإشعارات"
      subtitle="تحديد وتخصيص قنوات الإرسال المعتمدة للتنبيهات"
      dbKey="notification-channels"
      defaults={defaultChannels}
      placeholder="اسم قناة إشعار جديدة (مثلاً: تيليجرام)..."
    />
  );
}

/**
 * 3. Dynamic Security Features / Policies Manager
 */
export function SecurityFeaturesSettings() {
  return (
    <DynamicTagManager
      title="الأمان وسياسات الحماية"
      subtitle="المعايير والبروتوكولات الأمنية المطبقة في النظام"
      dbKey="security-features"
      defaults={defaultSecurity}
      placeholder="إضافة معيار أو سياسة أمان جديدة..."
    />
  );
}
