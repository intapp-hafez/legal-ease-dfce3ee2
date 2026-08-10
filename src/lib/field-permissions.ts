import { useCallback, useEffect, useState } from "react";
import { useAuth, type User } from "@/lib/auth";

export type EmployeeFieldGroup = "basics" | "contact" | "job" | "financial";

export type EmployeeFieldDef = {
  id: string;
  label: string;
  group: EmployeeFieldGroup;
  description?: string;
  isSensitive?: boolean;
};

export const EMPLOYEE_FIELDS: EmployeeFieldDef[] = [
  // 1. Basics & Identity
  { id: "full_name", label: "الاسم الكامل", group: "basics" },
  { id: "emp_code", label: "الرقم الوظيفي", group: "basics" },
  { id: "national_id", label: "الرقم القومي", group: "basics", isSensitive: true },
  { id: "gender", label: "الجنس", group: "basics" },
  { id: "role", label: "الدور في النظام", group: "basics" },

  // 2. Contact & Location
  { id: "email", label: "البريد الإلكتروني", group: "contact" },
  { id: "phone", label: "رقم الهاتف", group: "contact", isSensitive: true },
  { id: "city_id", label: "المدينة", group: "contact" },
  { id: "district_id", label: "الحي السكني", group: "contact" },

  // 3. Job & Contract
  { id: "department_id", label: "القسم / الإدارة", group: "job" },
  { id: "position_id", label: "المسمى الوظيفي", group: "job" },
  { id: "contract_type", label: "نوع العقد", group: "job" },
  { id: "contract_start_date", label: "تاريخ بداية العقد", group: "job" },
  { id: "contract_end_date", label: "تاريخ نهاية العقد", group: "job" },
  { id: "id_issue_date", label: "تاريخ إصدار الهوية", group: "job" },
  { id: "id_expiry_date", label: "تاريخ انتهاء الهوية", group: "job" },

  // 4. Financial & Insurance (Sensitive)
  { id: "salary_amount", label: "قيمة الراتب", group: "financial", isSensitive: true },
  { id: "salary_type", label: "نوع الراتب", group: "financial", isSensitive: true },
  { id: "is_insured", label: "حالة التأمين الاجتماعي", group: "financial" },
  { id: "insurance_number", label: "الرقم التأميني", group: "financial", isSensitive: true },
  { id: "bank_account_number", label: "رقم الحساب البنكي / IBAN", group: "financial", isSensitive: true },
];

export const FIELD_GROUPS: { id: EmployeeFieldGroup; label: string; icon: string }[] = [
  { id: "basics", label: "الهوية والأساسيات", icon: "🪪" },
  { id: "contact", label: "التواصل والموقع", icon: "📞" },
  { id: "job", label: "الوظيفة والعقود", icon: "🏢" },
  { id: "financial", label: "البيانات المالية والتأمينية", icon: "💰" },
];

const STORAGE_KEY = "int-legal:user_field_permissions";

export type PermissionsMap = Record<string, Record<string, boolean>>;

function loadAllPermissions(): PermissionsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllPermissions(map: PermissionsMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Could not save field permissions:", e);
  }
}

/**
 * Returns default visibility for all fields (all true by default).
 */
export function getDefaultFieldPermissions(): Record<string, boolean> {
  const perms: Record<string, boolean> = {};
  for (const f of EMPLOYEE_FIELDS) {
    perms[f.id] = true;
  }
  return perms;
}

export function useFieldPermissions() {
  const { user } = useAuth();
  const [allPerms, setAllPerms] = useState<PermissionsMap>(() => loadAllPermissions());

  useEffect(() => {
    const handleStorage = () => setAllPerms(loadAllPermissions());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  /**
   * Check if a specific user (or the current logged-in user) can view a field.
   * Super Admin always has full visibility for all fields.
   */
  const canView = useCallback(
    (fieldId: string, targetUser?: User | null): boolean => {
      const u = targetUser ?? user;
      if (!u) return false;
      // Super Admin sees everything
      if (u.role === "super_admin") return true;

      const userMap = allPerms[u.id] || allPerms[u.username];
      if (!userMap) {
        // If not configured, default is true
        return true;
      }
      return userMap[fieldId] !== false;
    },
    [user, allPerms]
  );

  /**
   * Get permissions object for a specific user.
   */
  const getUserPermissions = useCallback(
    (userId: string): Record<string, boolean> => {
      const defaults = getDefaultFieldPermissions();
      const existing = allPerms[userId] || {};
      return { ...defaults, ...existing };
    },
    [allPerms]
  );

  /**
   * Update permissions for a specific user.
   */
  const setUserPermissions = useCallback(
    (userId: string, permissions: Record<string, boolean>) => {
      const next = { ...allPerms, [userId]: permissions };
      setAllPerms(next);
      saveAllPermissions(next);
    },
    [allPerms]
  );

  /**
   * Reset user permissions to default (all visible).
   */
  const resetUserPermissions = useCallback(
    (userId: string) => {
      const next = { ...allPerms };
      delete next[userId];
      setAllPerms(next);
      saveAllPermissions(next);
    },
    [allPerms]
  );

  return {
    canView,
    getUserPermissions,
    setUserPermissions,
    resetUserPermissions,
    allFields: EMPLOYEE_FIELDS,
    fieldGroups: FIELD_GROUPS,
  };
}
