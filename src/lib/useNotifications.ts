import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { hrSupabase } from "@/lib/hr-supabase";
import { useAuth } from "@/lib/auth";
import { defaultNotificationRules, type NotificationRule } from "@/lib/notification-rules";
import {
  companyDocuments,
  contracts,
  tasks,
  cases,
  assets,
} from "@/lib/legal-data";

export type Notification = {
  id: string;
  user_id: string;
  category?: "عقود" | "هويات الموظفين" | "مستندات" | "مهام" | "قضايا" | "عهد" | "مخالفات" | "طلبات" | "عام";
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  recipient_name?: string;
};

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isSuperAdmin = user?.role === "super_admin";
  const queryKey = ["notifications", user?.id, isSuperAdmin];

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      const readDyn = JSON.parse(localStorage.getItem("read_dyn_notifs") || "{}");
      const rulesRaw = localStorage.getItem("int-legal:notification-rules");
      let activeRules: NotificationRule[] = defaultNotificationRules;
      if (rulesRaw) {
        try {
          const parsed = JSON.parse(rulesRaw);
          if (Array.isArray(parsed)) activeRules = parsed;
        } catch {}
      }

      const isRuleEnabled = (id: string) => {
        const r = activeRules.find((x) => x.id === id);
        return r ? r.enabled : true;
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Fetch DB notifications
      let dbQuery = supabase.from("notifications").select("*, profiles:user_id(full_name)");
      if (!isSuperAdmin) {
        dbQuery = dbQuery.eq("user_id", user.id);
      }
      const { data: dbData } = await dbQuery.order("created_at", { ascending: false }).limit(100);

      let allNotifs: Notification[] = (dbData || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        category: row.category || "عام",
        title: row.title,
        message: row.message,
        link: row.link,
        is_read: !!row.is_read,
        created_at: row.created_at,
        recipient_name: row.profiles?.full_name || undefined,
      }));

      // 2. Fetch live contracts from DB or fallback mock
      const { data: dbContracts } = await supabase.from("contracts").select("*");
      const contractItems = (dbContracts && dbContracts.length > 0) ? dbContracts : contracts;

      contractItems.forEach((c: any) => {
        const endDate = c.end_date || c.end;
        const empName = c.employee_name || c.employee || "موظف";
        const cNo = c.no || c.contract_no || "عقد";

        if (endDate) {
          const expDate = new Date(endDate);
          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (isRuleEnabled("contract_near_expiry") && diffDays <= 45 && diffDays >= 0) {
            const id = `dyn-contract-${c.id || cNo}`;
            allNotifs.push({
              id,
              user_id: user.id,
              category: "عقود",
              title: "تنبيه: عقد قارب على الانتهاء",
              message: `عقد ${cNo} الخاص بالموظف (${empName}) سينتهي بعد ${diffDays} يوماً.`,
              link: "/contracts",
              is_read: !!readDyn[id],
              created_at: new Date(today.getTime() - (45 - diffDays) * 3600000).toISOString(),
              recipient_name: isSuperAdmin ? empName : "إدارة العقود",
            });
          } else if (isRuleEnabled("contract_expiry_all") && diffDays < 0 && diffDays >= -60) {
            const id = `dyn-contract-exp-${c.id || cNo}`;
            allNotifs.push({
              id,
              user_id: user.id,
              category: "عقود",
              title: "عقد منتهي الصلاحية",
              message: `عقد ${cNo} الخاص بالموظف (${empName}) انتهى منذ ${Math.abs(diffDays)} يوماً وبحاجة لتجديد.`,
              link: "/contracts",
              is_read: !!readDyn[id],
              created_at: new Date(today.getTime() - Math.abs(diffDays) * 3600000).toISOString(),
              recipient_name: isSuperAdmin ? empName : "إدارة العقود",
            });
          }
        }

        if (isRuleEnabled("contract_pending_sign") && (c.status === "قيد المراجعة" || c.status === "بانتظار التوقيع")) {
          const id = `dyn-contract-review-${c.id || cNo}`;
          allNotifs.push({
            id,
            user_id: user.id,
            category: "عقود",
            title: "عقد بانتظار الاعتماد والتوقيع",
            message: `عقد ${cNo} للموظف (${empName}) مسجل بحالة «${c.status}» وبانتظار المراجعة القانونية.`,
            link: "/contracts",
            is_read: !!readDyn[id],
            created_at: new Date(today.getTime() - 7200000).toISOString(),
            recipient_name: isSuperAdmin ? empName : "الشؤون القانونية",
          });
        }
      });

      // 3. Employee ID Expirations (هويات وإقامات الموظفين)
      if (isRuleEnabled("employee_id_expiry") || isRuleEnabled("employee_id_near_expiry")) {
        try {
          const { data: profilesData } = await hrSupabase.from("profiles").select("id, full_name, national_id_expiry, id_expiry_date, employee_code");
          if (profilesData) {
            profilesData.forEach((p: any) => {
              const idExp = p.id_expiry_date || p.national_id_expiry;
              if (idExp) {
                const expDate = new Date(idExp);
                const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const empName = p.full_name || p.employee_code || "موظف";

                if (isRuleEnabled("employee_id_near_expiry") && diffDays <= 30 && diffDays >= 0) {
                  const id = `dyn-empid-near-${p.id}`;
                  allNotifs.push({
                    id,
                    user_id: user.id,
                    category: "هويات الموظفين",
                    title: "تنبيه: اقتراب انتهاء هوية موظف",
                    message: `بطاقة الهوية / الإقامة للموظف (${empName}) ستنتهي بعد ${diffDays} يوم.`,
                    link: `/employee/${p.id}`,
                    is_read: !!readDyn[id],
                    created_at: new Date(today.getTime() - (30 - diffDays) * 3600000).toISOString(),
                    recipient_name: empName,
                  });
                } else if (isRuleEnabled("employee_id_expiry") && diffDays < 0) {
                  const id = `dyn-empid-exp-${p.id}`;
                  allNotifs.push({
                    id,
                    user_id: user.id,
                    category: "هويات الموظفين",
                    title: "هوية / إقامة موظف منتهية الصلاحية 🪪",
                    message: `انتهت صلاحية هوية الموظف (${empName}) منذ ${Math.abs(diffDays)} يوم، يرجى التجديد لتفادي الغرامات.`,
                    link: `/employee/${p.id}`,
                    is_read: !!readDyn[id],
                    created_at: new Date(today.getTime() - 12000000).toISOString(),
                    recipient_name: empName,
                  });
                }
              }
            });
          }
        } catch (e) {
          console.warn("Could not check employee ID expirations:", e);
        }
      }

      // 4. Fetch live documents from DB or fallback mock
      const { data: dbDocs } = await supabase.from("documents").select("*");
      const docItems = (dbDocs && dbDocs.length > 0) ? dbDocs : companyDocuments;

      docItems.forEach((doc: any) => {
        const exp = doc.expiry_date || doc.expiry;
        const name = doc.name || "مستند";
        const docNo = doc.no || "DOC";

        if (exp) {
          const expDate = new Date(exp);
          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (isRuleEnabled("doc_near_expiry") && diffDays <= 60 && diffDays >= 0) {
            const id = `dyn-doc-${doc.id || docNo}`;
            allNotifs.push({
              id,
              user_id: user.id,
              category: "مستندات",
              title: "تذكير: ترخيص / مستند شارف على الانتهاء",
              message: `المستند الرسمي "${name}" (${docNo}) سينتهي بعد ${diffDays} يوم. يرجى تجديد الترخيص.`,
              link: "/documents",
              is_read: !!readDyn[id],
              created_at: new Date(today.getTime() - (60 - diffDays) * 3600000).toISOString(),
              recipient_name: doc.owner || "الشؤون القانونية",
            });
          } else if (isRuleEnabled("doc_expiry_all") && diffDays < 0) {
            const id = `dyn-doc-exp-${doc.id || docNo}`;
            allNotifs.push({
              id,
              user_id: user.id,
              category: "مستندات",
              title: "مستند وترخيص رسمي منتهي الصلاحية",
              message: `المستند "${name}" (${docNo}) منتهي الصلاحية منذ ${Math.abs(diffDays)} يوماً.`,
              link: "/documents",
              is_read: !!readDyn[id],
              created_at: new Date(today.getTime() - 14400000).toISOString(),
              recipient_name: doc.owner || "الشؤون القانونية",
            });
          }
        }
      });

      // 5. Fetch Tasks (Overdue, New)
      const { data: dbTasks } = await supabase.from("tasks").select("*");
      const taskItems = (dbTasks && dbTasks.length > 0) ? dbTasks : tasks;

      taskItems.forEach((t: any) => {
        const tNo = t.no || t.id || "TSK";
        const title = t.title || "مهمة";
        const assignee = t.assignee || t.assignee_name || "الفريق القانوني";

        if (isRuleEnabled("task_overdue") && t.status === "متأخرة") {
          const id = `dyn-task-late-${t.id || tNo}`;
          allNotifs.push({
            id,
            user_id: user.id,
            category: "مهام",
            title: "تنبيه مهمة متأخرة ⚠️",
            message: `المهمة «${title}» (${tNo}) متأخرة عن موعدها المحدد وتتطلب تدخلاً عاجلاً.`,
            link: "/tasks",
            is_read: !!readDyn[id],
            created_at: new Date(today.getTime() - 10800000).toISOString(),
            recipient_name: assignee,
          });
        } else if (isRuleEnabled("task_assigned") && t.status === "جديدة") {
          const id = `dyn-task-new-${t.id || tNo}`;
          allNotifs.push({
            id,
            user_id: user.id,
            category: "مهام",
            title: "مهمة جديدة مسندة",
            message: `تم إسناد مهمة جديدة: «${title}» (${tNo}) للمتابعة والإنجاز.`,
            link: "/tasks",
            is_read: !!readDyn[id],
            created_at: new Date(today.getTime() - 18000000).toISOString(),
            recipient_name: assignee,
          });
        }
      });

      // 6. Fetch Cases (Upcoming Hearings)
      const { data: dbCases } = await supabase.from("cases").select("*");
      const caseItems = (dbCases && dbCases.length > 0) ? dbCases : cases;

      caseItems.forEach((cs: any) => {
        const cNo = cs.no || cs.case_no || "CS";
        const title = cs.name || cs.title || "قضية";
        const hearing = cs.hearing_date || cs.hearing;

        if (isRuleEnabled("case_hearing_upcoming") && hearing) {
          const hDate = new Date(hearing);
          const diffDays = Math.ceil((hDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= -1 && diffDays <= 14) {
            const id = `dyn-case-hearing-${cs.id || cNo}`;
            allNotifs.push({
              id,
              user_id: user.id,
              category: "قضايا",
              title: "موعد جلسة محكمة قادمة ⚖️",
              message: `جلسة القضية «${title}» أمام ${cs.court || "المحكمة"} ${diffDays === 0 ? "اليوم" : `خلال ${diffDays} يوم`}.`,
              link: "/cases",
              is_read: !!readDyn[id],
              created_at: new Date(today.getTime() - 21600000).toISOString(),
              recipient_name: cs.lawyer || "المستشار القانوني",
            });
          }
        }
      });

      // 7. Fetch Assets (Awaiting Return, Lost, Maintenance)
      const { data: dbAssets } = await supabase.from("assets").select("*");
      const assetItems = (dbAssets && dbAssets.length > 0) ? dbAssets : assets;

      assetItems.forEach((ast: any) => {
        const astCode = ast.code || ast.id || "AST";
        const name = ast.name || "عهدة";
        const empName = ast.employee || ast.employee_name || "موظف";

        if (isRuleEnabled("custody_return_due") && ast.status === "بانتظار الإرجاع") {
          const id = `dyn-asset-return-${ast.id || astCode}`;
          allNotifs.push({
            id,
            user_id: user.id,
            category: "عهد",
            title: "عهدة بانتظار الاستلام والإرجاع 📦",
            message: `العهدة «${name}» (${astCode}) بحوزة (${empName}) بانتظار تسليمها للمستودع.`,
            link: "/custody",
            is_read: !!readDyn[id],
            created_at: new Date(today.getTime() - 28800000).toISOString(),
            recipient_name: isSuperAdmin ? empName : "إدارة الأصول",
          });
        } else if (isRuleEnabled("custody_lost_alert") && ast.status === "مفقودة") {
          const id = `dyn-asset-lost-${ast.id || astCode}`;
          allNotifs.push({
            id,
            user_id: user.id,
            category: "عهد",
            title: "بلاغ عهدة مفقودة ⚠️",
            message: `تم تسجيل العهدة «${name}» (${astCode}) كعهدة مفقودة للموظف (${empName}).`,
            link: "/custody",
            is_read: !!readDyn[id],
            created_at: new Date(today.getTime() - 36000000).toISOString(),
            recipient_name: isSuperAdmin ? empName : "الأمن والشؤون الإدارية",
          });
        }
      });

      // Sort combined chronologically (newest first)
      allNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return allNotifs;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channelId = `notifications-${user.id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, queryKey]);

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isRead }: { id: string; isRead: boolean }) => {
      if (id.startsWith("dyn-")) {
        const readDyn = JSON.parse(localStorage.getItem("read_dyn_notifs") || "{}");
        if (isRead) {
          readDyn[id] = true;
        } else {
          delete readDyn[id];
        }
        localStorage.setItem("read_dyn_notifs", JSON.stringify(readDyn));
        return;
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: isRead })
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async ({ id, isRead }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Notification[]>(queryKey);
      if (prev) {
        queryClient.setQueryData<Notification[]>(
          queryKey,
          prev.map((n) => (n.id === id ? { ...n, is_read: isRead } : n))
        );
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKey, context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      // Mark dynamic ones as read
      const dynUnread = notifications.filter((n) => !n.is_read && n.id.startsWith("dyn-"));
      if (dynUnread.length > 0) {
        const readDyn = JSON.parse(localStorage.getItem("read_dyn_notifs") || "{}");
        dynUnread.forEach((n) => (readDyn[n.id] = true));
        localStorage.setItem("read_dyn_notifs", JSON.stringify(readDyn));
      }

      // Mark DB ones as read
      let query = supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
      if (!isSuperAdmin) {
        query = query.eq("user_id", user.id);
      }
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAsRead = (id: string) => toggleStatusMutation.mutate({ id, isRead: true });
  const markAsUnread = (id: string) => toggleStatusMutation.mutate({ id, isRead: false });
  const toggleStatus = (id: string, currentRead: boolean) =>
    toggleStatusMutation.mutate({ id, isRead: !currentRead });
  const markAllAsRead = () => markAllAsReadMutation.mutate();

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const activeCount = unreadCount;
  const inactiveCount = notifications.filter((n) => n.is_read).length;

  return {
    notifications,
    unreadCount,
    activeCount,
    inactiveCount,
    isSuperAdmin,
    markAsRead,
    markAsUnread,
    toggleStatus,
    markAllAsRead,
    isLoading,
  };
}
