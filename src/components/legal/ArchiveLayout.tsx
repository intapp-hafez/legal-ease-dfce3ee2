import { useState, useRef, useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  Clock,
  AlertTriangle,
  Star,
  Trash2,
} from "lucide-react";

const sidebarNav = [
  { id: "dashboard", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "departments", label: "الأقسام", icon: Building2 },
  { id: "my-documents", label: "مستنداتي", icon: FileText },
  { id: "shared", label: "مستندات مشتركة", icon: Users },
  { id: "recent", label: "الأخيرة", icon: Clock },
  { id: "expiring", label: "مستندات تنتهي قريباً", icon: AlertTriangle },
  { id: "favorites", label: "المفضلة", icon: Star },
  { id: "trash", label: "سلة المهملات", icon: Trash2 },
];

export function ArchiveSidebar({
  activeView,
  onViewChange,
  onNewClick,
}: {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewClick?: ((type: "folder" | "file") => void) | undefined;
}) {
  const { can } = useAuth();
  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-l border-border bg-card">
      <div className="flex flex-col gap-2 p-4">
          <button
            onClick={() => onNewClick?.("file")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <FileText className="size-4" />
            رفع مستندات
          </button>
          <button
            onClick={() => onNewClick?.("folder")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
          >
            <Building2 className="size-4" />
            مجلد جديد
          </button>
        </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {sidebarNav.map(({ id, label, icon: Icon }) => {
            const active = activeView === id;
            return (
              <li key={id}>
                <button
                  onClick={() => onViewChange(id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/80 hover:bg-secondary"
                  }`}
                >
                  <Icon className={`size-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span>{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export function ArchiveLayout({
  activeView,
  onViewChange,
  onNewClick,
  children,
}: {
  activeView: string;
  onViewChange: (view: string) => void;
  onNewClick?: ((type: "folder" | "file") => void) | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
      <ArchiveSidebar activeView={activeView} onViewChange={onViewChange} onNewClick={onNewClick} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
