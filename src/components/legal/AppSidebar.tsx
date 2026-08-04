import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderLock,
  FileSignature,
  PackageSearch,
  Gavel,
  ListChecks,
  ShieldAlert,
  Inbox,
  Archive,
  BarChart3,
  Settings,
} from "lucide-react";
import { useBranding } from "@/lib/branding";
import { useAuth, roleLabel, type ModuleId } from "@/lib/auth";

const nav = [
  { to: "/", id: "dashboard", label: "لوحة المعلومات", icon: LayoutDashboard },
  { to: "/documents", id: "documents", label: "مستندات الشركة", icon: FolderLock },
  { to: "/contracts", id: "contracts", label: "عقود الموظفين", icon: FileSignature },
  { to: "/custody", id: "custody", label: "عهد الموظفين", icon: PackageSearch },
  { to: "/cases", id: "cases", label: "القضايا القانونية", icon: Gavel },
  { to: "/tasks", id: "tasks", label: "المهام اليومية", icon: ListChecks },
  { to: "/violations", id: "violations", label: "مخالفات الموظفين", icon: ShieldAlert },
  { to: "/requests", id: "requests", label: "الطلبات القانونية", icon: Inbox },
  { to: "/repository", id: "repository", label: "مستودع المستندات", icon: Archive },
  { to: "/reports", id: "reports", label: "التقارير", icon: BarChart3 },
  { to: "/settings", id: "settings", label: "الإعدادات", icon: Settings },
] as const satisfies readonly { to: string; id: ModuleId; label: string; icon: unknown }[];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { branding } = useBranding();
  const { can, user } = useAuth();
  const visible = nav.filter((n) => can(n.id));
  return (
    <aside className="flex h-full w-[264px] shrink-0 flex-col bg-sidebar text-sidebar-foreground">

      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card p-1">
          <img src={branding.logoUrl} alt="شعار Integrated Technics" className="h-full w-full object-contain" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-base font-bold">INT القانوني</p>
          <p className="text-xs text-sidebar-foreground/80">نظام إدارة الشؤون القانونية</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-2 text-[11px] font-semibold tracking-wide text-sidebar-foreground/70">
          الوحدات الرئيسية
        </p>
        <ul className="space-y-1">
          {visible.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={onNavigate}
                activeOptions={{ exact: to === "/" }}
                activeProps={{
                  className:
                    "bg-sidebar-primary/15 text-sidebar-primary-foreground ring-1 ring-sidebar-primary/40",
                }}
                inactiveProps={{ className: "text-sidebar-foreground/90" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-foreground/80">
        <p className="font-medium text-sidebar-foreground/85">{user?.name ?? "—"}</p>
        <p>{user ? roleLabel(user.role) : "غير مسجّل"} — Integrated Technics</p>
      </div>
    </aside>
  );
}
