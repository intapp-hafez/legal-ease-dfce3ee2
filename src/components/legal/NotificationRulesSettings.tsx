import { useState } from "react";
import {
  Bell,
  Check,
  RotateCcw,
  FileCheck,
  Users,
  Files,
  ListChecks,
  Gavel,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Panel } from "@/components/legal/PageShell";
import { useNotificationRules, type NotificationRule } from "@/lib/notification-rules";
import { cn } from "@/lib/utils";

const categoryIcons: Record<NotificationRule["category"], React.ComponentType<{ className?: string }>> = {
  "العقود": FileCheck,
  "هويات الموظفين": Users,
  "مستندات الشركة": Files,
  "المهام": ListChecks,
  "القضايا والجلسات": Gavel,
  "العهد والأصول": Package,
  "المخالفات والطلبات": AlertTriangle,
};

export function NotificationRulesSettings() {
  const {
    rules,
    toggleRule,
    setCategoryEnabled,
    enableAll,
    disableAll,
    resetRules,
  } = useNotificationRules();

  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories: NotificationRule["category"][] = [
    "العقود",
    "هويات الموظفين",
    "مستندات الشركة",
    "المهام",
    "القضايا والجلسات",
    "العهد والأصول",
    "المخالفات والطلبات",
  ];

  const totalEnabled = rules.filter((r) => r.enabled).length;

  const filteredRules = activeCategory === "all"
    ? rules
    : rules.filter((r) => r.category === activeCategory);

  // Group rules by category
  const grouped = categories.map((cat) => ({
    category: cat,
    rules: rules.filter((r) => r.category === cat),
    enabledCount: rules.filter((r) => r.category === cat && r.enabled).length,
  }));

  return (
    <Panel
      title="قواعد وتفعيل إشعارات النظام التلقائية (System Notification Triggers)"
      subtitle={`تحديد أنواع الأحداث والتنبيهات التي يقوم النظام بإرسال إشعارات عنها تلقائياً (${totalEnabled} من أصل ${rules.length} مفعل)`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={enableAll}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:bg-secondary transition-colors"
          >
            <CheckCircle2 className="size-3.5 text-success" />
            تفعيل الكل
          </button>
          <button
            type="button"
            onClick={disableAll}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:bg-secondary transition-colors"
          >
            <XCircle className="size-3.5 text-destructive" />
            تعطيل الكل
          </button>
          <button
            type="button"
            onClick={resetRules}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="استعادة الإعدادات الافتراضية"
          >
            <RotateCcw className="size-3.5" />
            استعادة الافتراضي
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            كافة القواعد ({rules.length})
          </button>

          {grouped.map((g) => {
            const Icon = categoryIcons[g.category] || Bell;
            const isSelected = activeCategory === g.category;
            return (
              <button
                key={g.category}
                type="button"
                onClick={() => setActiveCategory(g.category)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="size-3.5" />
                <span>{g.category}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {g.enabledCount}/{g.rules.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grouped Rules Cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredRules.map((rule) => {
            const Icon = categoryIcons[rule.category] || Bell;
            return (
              <div
                key={rule.id}
                className={cn(
                  "flex items-start justify-between gap-3.5 rounded-xl border p-4 transition-all",
                  rule.enabled
                    ? "border-border bg-card shadow-xs hover:border-primary/40"
                    : "border-border/60 bg-muted/20 opacity-75"
                )}
              >
                <div className="flex items-start gap-3 flex-1">
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      rule.enabled
                        ? "border-success/30 bg-success/15 text-success"
                        : "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {rule.title}
                      </span>
                      <span className="rounded-md border border-border bg-secondary/80 px-1.5 py-0.2 text-[10px] text-muted-foreground">
                        {rule.category}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  aria-pressed={rule.enabled}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    rule.enabled ? "bg-success" : "bg-muted-foreground/30"
                  )}
                  title={rule.enabled ? "تعطيل هذا الإشعار" : "تفعيل هذا الإشعار"}
                >
                  <span className="sr-only">{rule.title}</span>
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                      rule.enabled ? "translate-x-0" : "-translate-x-5"
                    )}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
