import { useState } from "react";
import { Bell, Check, RotateCcw, User, Eye, EyeOff, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, type Notification } from "@/lib/useNotifications";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/date-utils";

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const {
    notifications,
    unreadCount,
    activeCount,
    inactiveCount,
    isSuperAdmin,
    markAsRead,
    markAsUnread,
    toggleStatus,
    markAllAsRead,
  } = useNotifications();

  const filteredList = notifications.filter((n) => {
    if (filter === "active") return !n.is_read;
    if (filter === "inactive") return n.is_read;
    return true;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-md border border-border p-2 text-foreground hover:bg-secondary/50 transition-colors"
          aria-label="الإشعارات"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-96 p-0 shadow-xl border border-border bg-card rounded-xl overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">الإشعارات</span>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <Shield className="size-3" />
                مدير عام
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="text-xs text-primary hover:underline font-medium"
            >
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        {/* Filter Tabs: الكل / النشطة / غير النشطة */}
        <div className="flex border-b border-border/80 bg-background/50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-center font-medium transition-colors",
              filter === "all"
                ? "bg-secondary text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            الكل ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-center font-medium transition-colors flex items-center justify-center gap-1.5",
              filter === "active"
                ? "bg-success/15 text-success font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="size-1.5 rounded-full bg-success inline-block" />
            النشطة ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("inactive")}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-center font-medium transition-colors",
              filter === "inactive"
                ? "bg-secondary text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            غير النشطة ({inactiveCount})
          </button>
        </div>

        {/* Notification List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-border/50">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="size-8 opacity-20 mb-2" />
              <p className="text-xs">لا توجد إشعارات في هذا القسم</p>
            </div>
          ) : (
            filteredList.map((n) => {
              const isActive = !n.is_read;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex flex-col gap-1.5 p-3.5 transition-colors hover:bg-secondary/40",
                    isActive ? "bg-primary/4" : "bg-card opacity-80"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Active Status Indicator */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                          isActive
                            ? "border-success/30 bg-success/15 text-success"
                            : "border-border bg-muted/60 text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            isActive ? "bg-success animate-pulse" : "bg-muted-foreground/60"
                          )}
                        />
                        {isActive ? "نشط" : "غير نشط"}
                      </span>

                      {/* Category Badge */}
                      {n.category && (
                        <span className="rounded-md border border-border bg-secondary/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                          {n.category}
                        </span>
                      )}

                      {/* Recipient badge if superadmin */}
                      {isSuperAdmin && n.recipient_name && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          <User className="size-2.5" />
                          {n.recipient_name}
                        </span>
                      )}
                    </div>

                    <span className="shrink-0 text-[10px] text-muted-foreground font-mono">
                      {formatDateTime(n.created_at)}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-foreground leading-snug">
                    {n.title}
                  </h4>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {n.message}
                  </p>

                  <div className="mt-1 flex items-center justify-between pt-1 border-t border-border/40">
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => {
                          if (isActive) markAsRead(n.id);
                          setOpen(false);
                        }}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        عرض التفاصيل ←
                      </Link>
                    ) : (
                      <div />
                    )}

                    {/* Toggle Active / Inactive Button */}
                    <button
                      type="button"
                      onClick={() => toggleStatus(n.id, n.is_read)}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                        isActive
                          ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          : "text-success hover:bg-success/10"
                      )}
                      title={isActive ? "تعطيل / تحديد كمقروء" : "إعادة تنشيط الإشعار"}
                    >
                      {isActive ? (
                        <>
                          <Check className="size-3 text-success" />
                          تحديد كمقروء
                        </>
                      ) : (
                        <>
                          <RotateCcw className="size-3" />
                          إعادة تنشيط
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
