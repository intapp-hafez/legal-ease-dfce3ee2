import { useState } from "react";
import { Bell, LogOut, Menu, Search, X } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { useAuth, roleLabel } from "@/lib/auth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

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

          <div className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-10 w-full rounded-lg border border-border bg-card pr-9 pl-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
              placeholder="بحث شامل: موظف، رقم عقد، مستند، قضية، رقم عهدة…"
            />
          </div>

          <button className="relative rounded-md border border-border p-2 text-foreground" aria-label="الإشعارات">
            <Bell className="size-4" />
            <span className="absolute -top-1 -left-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              4
            </span>
          </button>

          <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 sm:flex">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              ح
            </span>
            <span className="text-xs text-foreground">أ. حافظ رحيم</span>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
