import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { logAudit } from "@/lib/audit";
import { supabase } from "@/lib/supabase";

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
  password?: string;
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
  users: User[]; // All users (for admin panel if needed)
  matrix: RoleMatrix;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  can: (module: ModuleId, action?: "view" | "edit") => boolean;
  saveUser: (user: User) => void;
  removeUser: (id: string) => void;
  setPerm: (role: RoleId, module: ModuleId, perm: Perm) => void;
  resetAccess: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [matrix, setMatrix] = useState<RoleMatrix>(() => readJson(MATRIX_KEY, defaultMatrix));

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) {
      setUsers(
        data.map((d: any) => ({
          id: d.id,
          name: d.full_name,
          username: d.employee_code || "user",
          role: (d.role as RoleId) || "employee",
          active: true,
        }))
      );
    }
  }, []);

  const fetchMatrix = useCallback(async () => {
    try {
      // 1. Try Supabase role_permissions
      const { data: permData, error: permError } = await supabase.from("role_permissions").select("*");
      if (!permError && permData && permData.length > 0) {
        const newMatrix = JSON.parse(JSON.stringify(defaultMatrix)) as RoleMatrix;
        // Reset everything to false first
        (Object.keys(newMatrix) as RoleId[]).forEach((r) => {
          (Object.keys(newMatrix[r]) as ModuleId[]).forEach((m) => {
            newMatrix[r][m] = { view: false, edit: false };
          });
        });
        // Populate from DB
        permData.forEach((row: any) => {
          const [mod, action] = row.permission.split(":");
          if (newMatrix[row.role as RoleId]?.[mod as ModuleId]) {
            newMatrix[row.role as RoleId][mod as ModuleId][action as "view" | "edit"] = true;
          }
        });
        setMatrix(newMatrix);
        writeJson(MATRIX_KEY, newMatrix);
        return;
      }

      // 2. Try Supabase settings table
      const { data: settingData, error: settingError } = await supabase.from("settings").select("value").eq("key", "role-matrix").maybeSingle();
      if (!settingError && settingData?.value) {
        setMatrix(settingData.value as RoleMatrix);
        writeJson(MATRIX_KEY, settingData.value);
        return;
      }
    } catch (e) {
      console.warn("Could not fetch permissions from Supabase:", e);
    }

    // 3. Fallback to localStorage
    const local = readJson<RoleMatrix>(MATRIX_KEY, defaultMatrix);
    setMatrix(local);
  }, []);

  useEffect(() => {
    fetchMatrix();

    // Initialize Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchUsers();
      } else {
        setReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchUsers();
      } else {
        setUser(null);
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setUser({
        id: data.id,
        name: data.full_name,
        username: data.employee_code || "user",
        role: (data.role as RoleId) || "employee",
        active: true,
      });
    }
    setReady(true);
  }

  const login = useCallback(
    async (username: string, password: string) => {
      const email = username.includes("@") ? username : `${username}@int.local`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { ok: false, error: "بيانات الدخول غير صحيحة" };
      }
      logAudit({ action: "تسجيل دخول", target: username, user_id: data.user?.id });
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(async () => {
    if (user) logAudit({ action: "تسجيل خروج", target: user.username, user_id: user.id });
    await supabase.auth.signOut();
    setUser(null);
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

  const saveUser = useCallback(async (next: User) => {
    // Only support updating existing profiles because creating auth users requires backend
    const { error } = await supabase.from("profiles").update({
      full_name: next.name,
      employee_code: next.username,
      role: next.role,
    }).eq("id", next.id);
    
    if (!error) {
      setUsers((prev) => prev.map((u) => (u.id === next.id ? next : u)));
      logAudit({ action: "تحديث مستخدم", target: next.username, details: String(next.role), user_id: user?.id || undefined });
    } else {
      console.error("Failed to update profile", error);
    }
  }, [user]);

  const removeUser = useCallback((id: string) => {
    // Only backend can remove Auth users. We can't do this from the frontend safely.
    alert("لا يمكن حذف المستخدمين من الواجهة لمتطلبات الأمان.");
  }, []);

  const setPerm = useCallback(async (role: RoleId, module: ModuleId, perm: Perm) => {
    let nextMatrix: RoleMatrix = defaultMatrix;
    setMatrix((prev) => {
      nextMatrix = { ...prev, [role]: { ...prev[role], [module]: perm } };
      writeJson(MATRIX_KEY, nextMatrix);
      return nextMatrix;
    });

    try {
      // 1. Try role_permissions table
      await supabase.from("role_permissions")
        .delete()
        .eq("role", role)
        .like("permission", `${module}:%`);

      const inserts = [];
      if (perm.view) inserts.push({ role, permission: `${module}:view` });
      if (perm.edit) inserts.push({ role, permission: `${module}:edit` });
      
      if (inserts.length > 0) {
        await supabase.from("role_permissions").insert(inserts);
      }
    } catch (e) {
      console.warn("Supabase role_permissions sync error:", e);
    }

    try {
      // 2. Also backup to settings table
      await supabase.from("settings").upsert({ key: "role-matrix", value: nextMatrix });
    } catch (e) {
      console.warn("Supabase settings sync error:", e);
    }

    logAudit({
      action: "تعديل صلاحيات",
      target: `${role} — ${module}`,
      details: `عرض: ${perm.view ? "نعم" : "لا"} • تعديل: ${perm.edit ? "نعم" : "لا"}`,
      user_id: user?.id || undefined
    });
  }, [user]);

  const resetAccess = useCallback(async () => {
    setUsers(seedUsers);
    setMatrix(defaultMatrix);
    writeJson(USERS_KEY, seedUsers);
    writeJson(MATRIX_KEY, defaultMatrix);
    try {
      await supabase.from("settings").upsert({ key: "role-matrix", value: defaultMatrix });
    } catch {}
    logAudit({ action: "استعادة إعدادات الصلاحيات", target: "الإعدادات", user_id: user?.id || undefined });
  }, [user]);

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
