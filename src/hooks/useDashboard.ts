import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatDate, formatDateTime } from "@/lib/date-utils";

const AUDIT_STORAGE_KEY = "int-legal:audit-logs";

const fallbackActivities = [
  { user: "أ. حافظ رحيم (Super Admin)", action: "تحديث مصفوفة الصلاحيات وقواعد الإشعارات", time: "قبل قليل" },
  { user: "م. سارة يوسف (Admin)", action: "اعتماد وتوثيق عقد موظف", time: "منذ ساعة" },
  { user: "إدارة الموارد البشرية", action: "رفع نسخة محدثة من السجل التجاري", time: "منذ 3 ساعات" },
  { user: "النظام التلقائي", action: "فحص دوري وإرسال تنبيهات الانتهاء", time: "منذ يوم" },
];

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);
      const todayStr = now.toISOString().split("T")[0];
      const in30DaysStr = in30Days.toISOString().split("T")[0];

      // 1. Fetch KPI counts concurrently
      const [
        { count: totalProfiles },
        { count: insuredProfiles },
        { count: activeContracts },
        { count: expiringContracts },
        { count: totalDocuments },
        { count: totalAssets },
        { count: assignedAssets },
        { count: openCases },
        { count: totalViolations },
        { count: totalRequests },
        { count: newTasks },
        { count: inProgressTasks },
        { count: lateTasks },
        { count: completedTasks },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_insured", true),
        supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "نشط"),
        supabase.from("contracts").select("*", { count: "exact", head: true }).gte("end_date", todayStr).lte("end_date", in30DaysStr),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("assets").select("*", { count: "exact", head: true }),
        supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "مُسندة"),
        supabase.from("cases").select("*", { count: "exact", head: true }).neq("status", "مغلقة"),
        supabase.from("violations").select("*", { count: "exact", head: true }),
        supabase.from("requests").select("*", { count: "exact", head: true }),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "جديدة"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "قيد التنفيذ"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "متأخرة"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "مكتملة"),
      ]);

      // 2. Fetch recent activities — use recently created/updated records across real tables
      let recentActivities: any[] = [];
      try {
        // Try audit_logs first (may be empty due to RLS)
        const { data: auditData } = await supabase
          .from("audit_logs")
          .select("action, action_time, profiles:user_id(full_name)")
          .order("action_time", { ascending: false })
          .limit(5);
        if (auditData && auditData.length > 0) {
          recentActivities = auditData.map((a: any) => ({
            user: a.profiles?.full_name || "النظام",
            action: a.action,
            time: a.action_time ? formatDateTime(a.action_time) : "قبل قليل",
          }));
        } else {
          // Build activity feed from real tables with timestamps
          const [recentContracts, recentDocs, recentTasks, recentCases] = await Promise.all([
            supabase.from("contracts").select("no, employee_name, created_at").order("created_at", { ascending: false }).limit(2),
            supabase.from("documents").select("name, created_at").order("created_at", { ascending: false }).limit(2),
            supabase.from("tasks").select("title, status, created_at").order("created_at", { ascending: false }).limit(2),
            supabase.from("cases").select("name, created_at").order("created_at", { ascending: false }).limit(2),
          ]);
          const activities: any[] = [];
          (recentContracts.data || []).forEach((c: any) => activities.push({
            user: c.employee_name || "مستخدم النظام",
            action: `تسجيل / تحديث عقد رقم ${c.no}`,
            time: formatDateTime(c.created_at),
          }));
          (recentDocs.data || []).forEach((d: any) => activities.push({
            user: "إدارة المستندات",
            action: `رفع مستند: ${d.name}`,
            time: formatDateTime(d.created_at),
          }));
          (recentTasks.data || []).forEach((t: any) => activities.push({
            user: "مدير المهام",
            action: `إضافة مهمة جديدة: ${t.title}`,
            time: formatDateTime(t.created_at),
          }));
          (recentCases.data || []).forEach((cs: any) => activities.push({
            user: "المستشار القانوني",
            action: `تحديث قضية: ${cs.name}`,
            time: formatDateTime(cs.created_at),
          }));
          recentActivities = activities
            .sort((a, b) => b.time.localeCompare(a.time))
            .slice(0, 5);
        }
      } catch {}

      // Try localStorage cache as last fallback
      if (recentActivities.length === 0 && typeof window !== "undefined") {
        const local = window.localStorage.getItem(AUDIT_STORAGE_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) {
              recentActivities = parsed.slice(0, 5).map((e: any) => ({
                user: e.user, action: e.action, time: e.time,
              }));
            }
          } catch {}
        }
      }

      // 5b. Fetch repository folders — use real tables: documents + contracts grouped by category
      let repositoryFolders: any[] = [];
      try {
        const [empCount, docCount, contractCount, caseCount, assetCountResult, policyCount] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("documents").select("*", { count: "exact", head: true }),
          supabase.from("contracts").select("*", { count: "exact", head: true }),
          supabase.from("cases").select("*", { count: "exact", head: true }),
          supabase.from("assets").select("*", { count: "exact", head: true }),
          supabase.from("requests").select("*", { count: "exact", head: true }),
        ]);

        // Get latest updated_at per category
        const { data: latestDoc } = await supabase.from("documents").select("created_at").order("created_at", { ascending: false }).limit(1);
        const { data: latestContract } = await supabase.from("contracts").select("created_at").order("created_at", { ascending: false }).limit(1);
        const { data: latestCase } = await supabase.from("cases").select("created_at").order("created_at", { ascending: false }).limit(1);
        const { data: latestProfile } = await supabase.from("profiles").select("created_at").order("created_at", { ascending: false }).limit(1);
        const { data: latestAsset } = await supabase.from("assets").select("created_at").order("created_at", { ascending: false }).limit(1);
        const { data: latestRequest } = await supabase.from("requests").select("created_at").order("created_at", { ascending: false }).limit(1);

        repositoryFolders = [
          { folder: "الموظفون",            files: empCount.count      || 0, updated: latestProfile?.[0]?.created_at  ? formatDate(latestProfile[0].created_at)  : "—" },
          { folder: "الشركة (مستندات)",  files: docCount.count      || 0, updated: latestDoc?.[0]?.created_at      ? formatDate(latestDoc[0].created_at)      : "—" },
          { folder: "العقود",             files: contractCount.count || 0, updated: latestContract?.[0]?.created_at  ? formatDate(latestContract[0].created_at)  : "—" },
          { folder: "القضايا القانونية", files: caseCount.count      || 0, updated: latestCase?.[0]?.created_at      ? formatDate(latestCase[0].created_at)      : "—" },
          { folder: "العهد (أصول)",      files: assetCountResult.count || 0, updated: latestAsset?.[0]?.created_at    ? formatDate(latestAsset[0].created_at)    : "—" },
          { folder: "الطلبات القانونية", files: policyCount.count    || 0, updated: latestRequest?.[0]?.created_at   ? formatDate(latestRequest[0].created_at)   : "—" },
        ];
      } catch (e) {
        console.warn("repo folders error:", e);
      }

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
        ...(upcomingDocs || []).map((d) => ({
          name: d.name,
          type: "مستند",
          date: formatDate(d.expiry_date),
          days: calculateDays(d.expiry_date),
        })),
        ...(upcomingContracts || []).map((c) => ({
          name: `عقد ${c.no}`,
          type: "عقد",
          date: formatDate(c.end_date),
          days: calculateDays(c.end_date),
        })),
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
        insuredProfiles: insuredProfiles || 0,
        activeContracts: activeContracts || 0,
        expiringContracts: expiringContracts || 0,
        totalDocuments: totalDocuments || 0,
        totalAssets: totalAssets || 0,
        assignedAssets: assignedAssets || 0,
        openCases: openCases || 0,
        totalViolations: totalViolations || 0,
        totalRequests: totalRequests || 0,
        newTasks: newTasks || 0,
        inProgressTasks: inProgressTasks || 0,
        lateTasks: lateTasks || 0,
        completedTasks: completedTasks || 0,
        recentActivities,
        repositoryFolders,
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
