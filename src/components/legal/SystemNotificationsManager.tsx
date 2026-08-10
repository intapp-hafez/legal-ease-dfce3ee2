import { useState } from "react";
import { Bell, Check, RotateCcw, User, Shield, Filter, Search, CheckCircle2, Clock } from "lucide-react";
import { Panel } from "@/components/legal/PageShell";
import { useNotifications } from "@/lib/useNotifications";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export function SystemNotificationsManager() {
  const { user } = useAuth();
  const {
    notifications,
    activeCount,
    inactiveCount,
    toggleStatus,
    markAllAsRead,
    isLoading,
  } = useNotifications();

  const [tab, setTab] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");

  if (user?.role !== "super_admin") return null;

  const filtered = notifications.filter((n) => {
    if (tab === "active" && n.is_read) return false;
    if (tab === "inactive" && !n.is_read) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchMsg = n.message.toLowerCase().includes(q);
      const matchUser = n.recipient_name?.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchUser;
    }
    return true;
  });

  return (
    <Panel
      title="مركز إشعارات النظام (Super Admin)"
      subtitle="متابعة وتفعيل وإلغاء تفعيل إشعارات النظام لجميع المستخدمين"
      action={
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <CheckCircle2 className="size-3.5 text-success" />
              تعطيل كافة النشطة
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Controls: Search and Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 text-xs">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "rounded-md px-3 py-1 font-medium transition-colors",
                tab === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              الكل ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("active")}
              className={cn(
                "rounded-md px-3 py-1 font-medium transition-colors flex items-center gap-1.5",
                tab === "active"
                  ? "bg-success text-success-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="size-1.5 rounded-full bg-success inline-block" />
              النشطة ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setTab("inactive")}
              className={cn(
                "rounded-md px-3 py-1 font-medium transition-colors",
                tab === "inactive"
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              غير النشطة ({inactiveCount})
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-xs flex-1">
            <Search className="absolute right-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الإشعارات..."
              className="h-8.5 w-full rounded-lg border border-border bg-background pr-8 pl-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Notifications Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="px-3 py-2.5 font-semibold">الحالة</th>
                <th className="px-3 py-2.5 font-semibold">النوع / القسم</th>
                <th className="px-3 py-2.5 font-semibold">المستلم</th>
                <th className="px-3 py-2.5 font-semibold">عنوان الإشعار</th>
                <th className="px-3 py-2.5 font-semibold">التفاصيل</th>
                <th className="px-3 py-2.5 font-semibold">التاريخ</th>
                <th className="px-3 py-2.5 font-semibold text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    لا توجد إشعارات مطابقة للبحث أو التصفية
                  </td>
                </tr>
              ) : (
                filtered.map((n) => {
                  const isActive = !n.is_read;
                  return (
                    <tr
                      key={n.id}
                      className={cn(
                        "transition-colors hover:bg-secondary/30",
                        isActive ? "bg-primary/4 font-medium" : "opacity-75"
                      )}
                    >
                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border",
                            isActive
                              ? "border-success/30 bg-success/15 text-success shadow-xs"
                              : "border-border bg-muted text-muted-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              isActive ? "bg-success animate-pulse" : "bg-muted-foreground/50"
                            )}
                          />
                          {isActive ? "نشط" : "غير نشط"}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="rounded-md border border-border bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-foreground">
                          {n.category || "عام"}
                        </span>
                      </td>

                      {/* Recipient */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <User className="size-3 text-muted-foreground" />
                          {n.recipient_name || "النظام"}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-3 py-3 whitespace-nowrap font-medium text-foreground">
                        {n.title}
                      </td>

                      {/* Message & Link */}
                      <td className="px-3 py-3 text-muted-foreground max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{n.message}</span>
                          {n.link && (
                            <Link
                              to={n.link}
                              className="text-primary hover:underline text-[11px] shrink-0 font-medium"
                            >
                              عرض ←
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 whitespace-nowrap font-mono text-muted-foreground">
                        {formatDateTime(n.created_at)}
                      </td>

                      {/* Toggle Action */}
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => toggleStatus(n.id, n.is_read)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors",
                            isActive
                              ? "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                              : "border-success/30 bg-success/10 text-success hover:bg-success/20"
                          )}
                        >
                          {isActive ? (
                            <>
                              <Check className="size-3 text-success" />
                              تعطيل
                            </>
                          ) : (
                            <>
                              <RotateCcw className="size-3" />
                              تنشيط
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}
