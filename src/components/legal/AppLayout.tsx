import { useState } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationPopover } from "./NotificationPopover";
import { useAuth, roleLabel } from "@/lib/auth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <AppSidebar />
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="إغلاق القائمة"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 h-full">
            <AppSidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:px-8">
          <button
            className="rounded-md border border-border p-2 text-foreground lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>

          <GlobalSearch />

          <NotificationPopover />

          <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 sm:flex">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user?.name?.trim()?.[0] ?? "؟"}
            </span>
            <span className="text-xs text-foreground">{user?.name ?? "زائر"}</span>
            <span className="text-[11px] text-muted-foreground">
              {user ? roleLabel(user.role) : ""}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-2 text-xs text-muted-foreground hover:bg-secondary"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
