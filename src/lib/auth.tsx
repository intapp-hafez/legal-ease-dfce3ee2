import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { logAudit } from "@/lib/audit";

/* ------------------------------------------------------------------ *
 * Frontend-only role prototype: users, roles and permissions live in
 * localStorage. This is NOT real authentication — no server, no tokens.
 * ------------------------------------------------------------------ */

export type RoleId = "super_admin" | "admin" | "employee";

export const ROLES: { id: RoleId; label: string; hint: string }[] = [
  { id: "super_admin", label: "مدير عام (Super Admin)", hint: "صلاحية كاملة + إدارة المستخدمين والصلاحيات" },
  { id: "admin", label: "مدير (Admin)", hint: "تشغيل كامل للوحدات بدون التحكم بالمستخدمين" },
  { id: "employee", label: "موظف (Employee)", hint: "عرض محدود لسجلاته ومهامه" },
];

export type ModuleId =
  | "dashboard"
  | "documents"
  | "contracts"
  | "custody"
  | "cases"
  | "tasks"
  | "violations"
  | "requests"
  | "repository"
  | "reports"
  | "settings";

export const MODULES: { id: ModuleId; label: string; path: string }[] = [
  { id: "dashboard", label: "لوحة المعلومات", path: "/" },
  { id: "documents", label: "مستندات الشركة", path: "/documents" },
  { id: "contracts", label: "عقود الموظفين", path: "/contracts" },
  { id: "custody", label: "عهد الموظفين", path: "/custody" },
  { id: "cases", label: "القضايا القانونية", path: "/cases" },
  { id: "tasks", label: "المهام اليومية", path: "/tasks" },
  { id: "violations", label: "مخالفات الموظفين", path: "/violations" },
  { id: "requests", label: "الطلبات القانونية", path: "/requests" },
  { id: "repository", label: "مستودع المستندات", path: "/repository" },
  { id: "reports", label: "التقارير", path: "/reports" },
  { id: "settings", label: "الإعدادات", path: "/settings" },
];

export type Perm = { view: boolean; edit: boolean };
export type RoleMatrix = Record<RoleId, Record<ModuleId, Perm>>;

function fill(view: boolean, edit: boolean): Record<ModuleId, Perm> {
  return MODULES.reduce(
    (acc, m) => ({ ...acc, [m.id]: { view, edit } }),
    {} as Record<ModuleId, Perm>,
  );
}

export const defaultMatrix: RoleMatrix = {
  super_admin: fill(true, true),
  admin: { ...fill(true, true), settings: { view: true, edit: false } },
  employee: {
    ...fill(false, false),
    dashboard: { view: true, edit: false },
    tasks: { view: true, edit: true },
    custody: { view: true, edit: false },
    repository: { view: true, edit: false },
  },
};

export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: RoleId;
  active: boolean;
};

export const seedUsers: User[] = [
  { id: "U-01", name: "أ. حافظ رحيم", username: "superadmin", password: "1234", role: "super_admin", active: true },
  { id: "U-02", name: "م. سارة يوسف", username: "admin", password: "1234", role: "admin", active: true },
  { id: "U-03", name: "خالد الشمري", username: "employee", password: "1234", role: "employee", active: true },
];

const USERS_KEY = "int-legal:users";
const MATRIX_KEY = "int-legal:role-matrix-v2";
const SESSION_KEY = "int-legal:session";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

type AuthCtx = {
  ready: boolean;
  user: User | null;
  users: User[];
  matrix: RoleMatrix;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  can: (module: ModuleId, action?: "view" | "edit") => boolean;
  saveUser: (user: User) => void;
  removeUser: (id: string) => void;
  setPerm: (role: RoleId, module: ModuleId, perm: Perm) => void;
  resetAccess: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>(seedUsers);
  const [matrix, setMatrix] = useState<RoleMatrix>(defaultMatrix);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const u = readJson<User[]>(USERS_KEY, seedUsers);
    const m = readJson<RoleMatrix>(MATRIX_KEY, defaultMatrix);
    setUsers(Array.isArray(u) && u.length ? u : seedUsers);
    setMatrix({ ...defaultMatrix, ...m });
    setUserId(readJson<string | null>(SESSION_KEY, null));
    setReady(true);
  }, []);

  const user = useMemo(
    () => users.find((u) => u.id === userId && u.active) ?? null,
    [users, userId],
  );

  const login = useCallback(
    (username: string, password: string) => {
      const found = users.find(
        (u) => u.username.trim().toLowerCase() === username.trim().toLowerCase(),
      );
      if (!found) return { ok: false, error: "اسم المستخدم غير موجود" };
      if (!found.active) return { ok: false, error: "الحساب موقوف — تواصل مع مدير النظام" };
      if (found.password !== password) return { ok: false, error: "كلمة المرور غير صحيحة" };
      setUserId(found.id);
      writeJson(SESSION_KEY, found.id);
      logAudit({ action: "تسجيل دخول", target: found.username, user: found.name });
      return { ok: true };
    },
    [users],
  );

  const logout = useCallback(() => {
    if (user) logAudit({ action: "تسجيل خروج", target: user.username, user: user.name });
    setUserId(null);
    writeJson(SESSION_KEY, null);
  }, [user]);

  const can = useCallback(
    (module: ModuleId, action: "view" | "edit" = "view") => {
      if (!user) return false;
      const perm = matrix[user.role]?.[module];
      if (!perm) return false;
      return action === "edit" ? perm.edit : perm.view || perm.edit;
    },
    [user, matrix],
  );

  const saveUser = useCallback((next: User) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === next.id);
      const list = exists ? prev.map((u) => (u.id === next.id ? next : u)) : [...prev, next];
      writeJson(USERS_KEY, list);
      return list;
    });
    logAudit({ action: "تحديث مستخدم", target: next.username, details: next.role });
  }, []);

  const removeUser = useCallback((id: string) => {
    setUsers((prev) => {
      const list = prev.filter((u) => u.id !== id);
      writeJson(USERS_KEY, list);
      return list;
    });
    logAudit({ action: "حذف مستخدم", target: id });
  }, []);

  const setPerm = useCallback((role: RoleId, module: ModuleId, perm: Perm) => {
    setMatrix((prev) => {
      const next: RoleMatrix = {
        ...prev,
        [role]: { ...prev[role], [module]: perm },
      };
      writeJson(MATRIX_KEY, next);
      return next;
    });
    logAudit({
      action: "تعديل صلاحيات",
      target: `${role} — ${module}`,
      details: `عرض: ${perm.view ? "نعم" : "لا"} • تعديل: ${perm.edit ? "نعم" : "لا"}`,
    });
  }, []);

  const resetAccess = useCallback(() => {
    setUsers(seedUsers);
    setMatrix(defaultMatrix);
    writeJson(USERS_KEY, seedUsers);
    writeJson(MATRIX_KEY, defaultMatrix);
    logAudit({ action: "استعادة إعدادات الصلاحيات", target: "الإعدادات" });
  }, []);

  const value: AuthCtx = {
    ready,
    user,
    users,
    matrix,
    login,
    logout,
    can,
    saveUser,
    removeUser,
    setPerm,
    resetAccess,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function roleLabel(role: RoleId) {
  return ROLES.find((r) => r.id === role)?.label ?? role;
}
