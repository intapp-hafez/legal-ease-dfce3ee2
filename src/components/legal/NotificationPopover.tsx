import { useState } from "react";
import { Bell, Check, Info } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/lib/useNotifications";
import { cn } from "@/lib/utils";

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-md border border-border p-2 text-foreground hover:bg-secondary/50 transition-colors"
          aria-label="الإشعارات"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -left-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-lg border border-border bg-card"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-semibold text-sm">الإشعارات</span>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-primary hover:underline font-medium"
            >
              تحديد الكل كمقروء
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="size-8 opacity-20 mb-2" />
              <p className="text-sm">لا توجد إشعارات حالياً</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex flex-col gap-1 border-b border-border/50 px-4 py-3 last:border-0 transition-colors hover:bg-secondary/30",
                    !n.is_read ? "bg-primary/5" : ""
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "mt-0.5 flex size-2 shrink-0 rounded-full",
                          !n.is_read ? "bg-primary" : "bg-transparent"
                        )}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {n.title}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString("ar-SA", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="mr-4 text-xs text-muted-foreground leading-relaxed">
                    {n.message}
                  </p>
                  <div className="mr-4 mt-1 flex items-center justify-between">
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => {
                          if (!n.is_read) markAsRead(n.id);
                          setOpen(false);
                        }}
                        className="text-[11px] font-medium text-primary hover:underline"
                      >
                        عرض التفاصيل
                      </Link>
                    ) : (
                      <div />
                    )}
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        <Check className="size-3" /> مقروء
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
