import { useQuery } from "@tanstack/react-query";
import { hrSupabase } from "@/lib/hr-supabase";
import { supabase } from "@/lib/supabase";

export function EmployeeCell({ employeeId }: { employeeId: string | null | undefined }) {
  const idStr = String(employeeId || "").trim();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);

  const { data: emp, isLoading } = useQuery({
    queryKey: ["hr-profile-cell", idStr],
    enabled: !!idStr && idStr !== "undefined" && idStr !== "null",
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      // 1. Non-UUID usernames
      if (!isUuid) {
        if (idStr === "admin") return { name: "مدير النظام (Admin)", code: "ADM", dept: "الإدارة" };
        if (idStr === "hr") return { name: "الموارد البشرية", code: "HR", dept: "HR" };
        return { name: idStr, code: "", dept: "" };
      }

      try {
        // 2. Try HR Supabase
        const hrRes = await hrSupabase
          .from("profiles")
          .select("id, full_name, emp_code, departments!profiles_department_id_fkey(name_ar, name_en)")
          .eq("id", idStr)
          .maybeSingle();

        if (hrRes.data) {
          const d = hrRes.data as any;
          return {
            name: d.full_name || "بدون اسم",
            code: d.emp_code || "",
            dept: d.departments?.name_ar || d.departments?.name_en || "",
          };
        }
      } catch (e) {
        console.warn("hrSupabase fetch error for cell:", e);
      }

      try {
        // 3. Fallback to local Supabase profiles
        const localRes = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", idStr)
          .maybeSingle();

        if (localRes.data) {
          return {
            name: localRes.data.full_name || idStr,
            code: "",
            dept: "",
          };
        }
      } catch (e) {
        console.warn("local supabase fetch error for cell:", e);
      }

      return {
        name: `مستخدم (${idStr.slice(0, 8)})`,
        code: idStr.slice(0, 6).toUpperCase(),
        dept: "",
      };
    },
  });

  if (!idStr) return <span className="text-muted-foreground">—</span>;

  if (isLoading) {
    return <span className="text-xs text-muted-foreground animate-pulse">جاري الجلب...</span>;
  }

  if (!emp) {
    return <span className="text-muted-foreground font-mono text-xs">{idStr}</span>;
  }

  return (
    <div className="flex items-center gap-1.5" dir="rtl">
      <div>
        <div className="font-semibold text-foreground leading-tight text-sm">
          {emp.name}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
          {emp.code && (
            <span className="font-mono font-medium text-[11px] bg-secondary px-1.5 py-0.2 rounded text-secondary-foreground">
              {emp.code}
            </span>
          )}
          {emp.dept && <span>{emp.dept}</span>}
        </div>
      </div>
    </div>
  );
}
