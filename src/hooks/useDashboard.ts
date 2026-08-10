import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      // 1. Fetch KPI counts
      const [
        { count: totalProfiles },
        { count: activeContracts },
        { count: totalAssets },
        { count: openCases },
        { count: todayTasks },
        { count: lateTasks }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "نشط"),
        supabase.from("assets").select("*", { count: "exact", head: true }),
        supabase.from("cases").select("*", { count: "exact", head: true }).neq("status", "مغلقة"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "جديدة"), // Simplified
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "متأخرة"),
      ]);

      // 2. Fetch recent activities (audit logs)
      const { data: recentActivities } = await supabase
        .from("audit_logs")
        .select(`
          action,
          action_time,
          profiles:user_id(full_name)
        `)
        .order("action_time", { ascending: false })
        .limit(5);

      // 3. Fetch upcoming expirations (documents + contracts)
      const { data: upcomingDocs } = await supabase
        .from("documents")
        .select("name, expiry_date")
        .not("expiry_date", "is", null)
        .order("expiry_date", { ascending: true })
        .limit(3);

      const { data: upcomingContracts } = await supabase
        .from("contracts")
        .select("no, end_date")
        .not("end_date", "is", null)
        .order("end_date", { ascending: true })
        .limit(2);

      const expirations = [
        ...(upcomingDocs || []).map(d => ({ name: d.name, type: "مستند", date: d.expiry_date, days: calculateDays(d.expiry_date) })),
        ...(upcomingContracts || []).map(c => ({ name: `عقد ${c.no}`, type: "عقد", date: c.end_date, days: calculateDays(c.end_date) }))
      ].sort((a, b) => a.days - b.days);

      // 4. Fetch today's tasks
      const { data: tasksList } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      // 5. Assets by category
      const { data: assetsData } = await supabase
        .from("assets")
        .select("category");
      
      const categoryCounts = (assetsData || []).reduce((acc: any, asset) => {
        acc[asset.category || "أخرى"] = (acc[asset.category || "أخرى"] || 0) + 1;
        return acc;
      }, {});

      const assetsByCategory = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

      return {
        totalProfiles: totalProfiles || 0,
        activeContracts: activeContracts || 0,
        totalAssets: totalAssets || 0,
        openCases: openCases || 0,
        todayTasks: todayTasks || 0,
        lateTasks: lateTasks || 0,
        recentActivities: (recentActivities || []).map(a => ({
          user: (a.profiles as any)?.full_name || "النظام",
          action: a.action,
          time: new Date(a.action_time).toLocaleDateString("ar-EG")
        })),
        upcomingExpirations: expirations,
        tasksList: tasksList || [],
        assetsByCategory: assetsByCategory.length > 0 ? assetsByCategory : [{ name: "لا يوجد بيانات", value: 1 }]
      };
    },
    refetchInterval: 30000,
  });
}

export function useEmployeeDashboard(userId?: string) {
  return useQuery({
    queryKey: ["employee-dashboard", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [
        { count: activeTasks },
        { count: assignedAssets },
        { data: tasksData },
      ] = await Promise.all([
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assignee_id", userId).neq("status", "مكتملة"),
        supabase.from("assets").select("*", { count: "exact", head: true }).eq("employee_id", userId),
        supabase.from("tasks").select("*").eq("assignee_id", userId).order("created_at", { ascending: false }).limit(5),
      ]);

      return {
        activeTasks: activeTasks || 0,
        assignedAssets: assignedAssets || 0,
        tasks: tasksData || []
      };
    }
  });
}

function calculateDays(dateStr: string) {
  if (!dateStr) return 999;
  const diffTime = Math.abs(new Date(dateStr).getTime() - new Date().getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
