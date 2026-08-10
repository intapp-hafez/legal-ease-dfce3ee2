import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type NotificationRule = {
  id: string;
  category: "العقود" | "هويات الموظفين" | "مستندات الشركة" | "المهام" | "القضايا والجلسات" | "العهد والأصول" | "المخالفات والطلبات";
  title: string;
  description: string;
  enabled: boolean;
};

export const defaultNotificationRules: NotificationRule[] = [
  // 1. العقود
  {
    id: "contract_expiry_all",
    category: "العقود",
    title: "إشعار انتهاء كافة أنواع العقود",
    description: "إرسال إشعار عند انتهاء أي نوع من العقود (عقود عمل، عقود شركة، مقرات، موردين، خدمات).",
    enabled: true,
  },
  {
    id: "contract_near_expiry",
    category: "العقود",
    title: "تذكير اقتراب موعد انتهاء العقد",
    description: "إرسال تنبيه تذكيري مسبق قبل انتهاء العقد (وفق جدول التذكيرات المعتمد 90، 60، 30، 15 يوماً).",
    enabled: true,
  },
  {
    id: "contract_pending_sign",
    category: "العقود",
    title: "عقود بانتظار التوقيع والمراجعة",
    description: "إرسال إشعار عند تسجيل عقد جديد بحالة 'قيد المراجعة' أو 'بانتظار التوقيع'.",
    enabled: true,
  },

  // 2. هويات الموظفين
  {
    id: "employee_id_expiry",
    category: "هويات الموظفين",
    title: "إشعار انتهاء هويات وإقامات الموظفين",
    description: "إرسال إشعار عند انتهاء بطاقة الرقم القومي، الهوية الوطنية، الإقامة، أو جواز السفر للموظف.",
    enabled: true,
  },
  {
    id: "employee_id_near_expiry",
    category: "هويات الموظفين",
    title: "تذكير قبل انتهاء هوية الموظف",
    description: "إرسال تنبيه مبكر قبل 30 يوماً من انتهاء صلاحية إقامة أو هوية أي موظف لتفادي الغرامات.",
    enabled: true,
  },

  // 3. مستندات وتراخيص الشركة
  {
    id: "doc_expiry_all",
    category: "مستندات الشركة",
    title: "إشعار انتهاء مستندات وتراخيص الشركة الرسمية",
    description: "إرسال إشعار عند انتهاء السجل التجاري، البطاقة الضريبية، الرخص الحكومية، أو شهادات العلامة التجارية.",
    enabled: true,
  },
  {
    id: "doc_near_expiry",
    category: "مستندات الشركة",
    title: "تذكير اقتراب انتهاء التراخيص والمستندات",
    description: "إرسال تنبيه دوري قبل 30 أو 60 يوماً من انتهاء التراخيص الحكومية والسجلات الرسمية.",
    enabled: true,
  },

  // 4. المهام اليومية
  {
    id: "task_assigned",
    category: "المهام",
    title: "إشعار إسناد مهمة جديدة",
    description: "إرسال إشعار فوري للموظف أو المستشار القانوني عند إسناد مهمة قانونية جديدة إليه.",
    enabled: true,
  },
  {
    id: "task_due",
    category: "المهام",
    title: "إشعار حلول موعد استحقاق المهمة",
    description: "إرسال تنبيه في يوم استحقاق المهمة المحدد للتسليم.",
    enabled: true,
  },
  {
    id: "task_overdue",
    category: "المهام",
    title: "إشعار تأخر المهمة عن موعدها المحدد ⚠️",
    description: "إرسال إشعار تحذيري عاجل عند تجاوز المهمة تاريخ الاستحقاق دون اكتمالها.",
    enabled: true,
  },

  // 5. القضايا والجلسات
  {
    id: "case_hearing_upcoming",
    category: "القضايا والجلسات",
    title: "إشعار موعد الجلسة القادمة في المحكمة ⚖️",
    description: "إرسال تذكير بالموعد القادم لجلسات المحاكم والترافع للقضايا المفتوحة.",
    enabled: true,
  },
  {
    id: "case_status_changed",
    category: "القضايا والجلسات",
    title: "إشعار تحديث حالة أو صدور حكم في قضية",
    description: "إرسال إشعار عند صدور قرار قضائي أو تحويل القضية للتحقيق أو إغلاقها.",
    enabled: true,
  },

  // 6. العهد والأصول
  {
    id: "custody_return_due",
    category: "العهد والأصول",
    title: "إشعار استحقاق إرجاع العهدة 📦",
    description: "إرسال إشعار عند انتهاء خدمة الموظف أو حلول موعد تسليم الأجهزة والعهد للمستودع.",
    enabled: true,
  },
  {
    id: "custody_lost_alert",
    category: "العهد والأصول",
    title: "إشعار بلاغ عهدة مفقودة أو تحت الصيانة",
    description: "إرسال إشعار لإدارة الأصول والأمن عند تسجيل عهدة كمفقودة أو تالفة.",
    enabled: true,
  },

  // 7. المخالفات والطلبات
  {
    id: "violation_registered",
    category: "المخالفات والطلبات",
    title: "إشعار تقييد مخالفة أو تحقيق إداري",
    description: "إرسال إشعار للموارد البشرية والمستشار القانوني عند قيد مخالفة جديدة على موظف.",
    enabled: true,
  },
  {
    id: "request_received",
    category: "المخالفات والطلبات",
    title: "إشعار استلام طلب أو استشارة قانونية جديدة",
    description: "إرسال إشعار عند تقديم استشارة أو صياغة عقد جديدة من أحد الأقسام.",
    enabled: true,
  },
];

const STORAGE_KEY = "int-legal:notification-rules";
const DB_KEY = "notification-rules-settings";

export function useNotificationRules() {
  const queryClient = useQueryClient();

  const { data: rules = defaultNotificationRules } = useQuery({
    queryKey: ["notification-rules"],
    queryFn: async () => {
      // 1. Try Supabase settings table
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("value")
          .eq("key", DB_KEY)
          .maybeSingle();

        if (!error && data?.value && Array.isArray(data.value)) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value));
          }
          return data.value as NotificationRule[];
        }
      } catch (e) {
        console.warn("Error fetching notification rules from Supabase:", e);
      }

      // 2. Try localStorage
      if (typeof window !== "undefined") {
        const local = window.localStorage.getItem(STORAGE_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) return parsed as NotificationRule[];
          } catch {}
        }
      }

      return defaultNotificationRules;
    },
    initialData: () => {
      if (typeof window !== "undefined") {
        const local = window.localStorage.getItem(STORAGE_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) return parsed as NotificationRule[];
          } catch {}
        }
      }
      return defaultNotificationRules;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newRules: NotificationRule[]) => {
      // 1. Save to localStorage immediately
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules));
      }

      // 2. Try Supabase background sync
      try {
        await supabase.from("settings").upsert({ key: DB_KEY, value: newRules });
      } catch (e) {
        console.warn("Supabase notification rules upsert error:", e);
      }

      return newRules;
    },
    onMutate: async (newRules) => {
      await queryClient.cancelQueries({ queryKey: ["notification-rules"] });
      const prev = queryClient.getQueryData<NotificationRule[]>(["notification-rules"]);
      queryClient.setQueryData(["notification-rules"], newRules);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["notification-rules"], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-rules"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const toggleRule = useCallback(
    (ruleId: string) => {
      const next = rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
      mutation.mutate(next);
    },
    [rules, mutation]
  );

  const setCategoryEnabled = useCallback(
    (category: NotificationRule["category"], enabled: boolean) => {
      const next = rules.map((r) => (r.category === category ? { ...r, enabled } : r));
      mutation.mutate(next);
    },
    [rules, mutation]
  );

  const enableAll = useCallback(() => {
    const next = rules.map((r) => ({ ...r, enabled: true }));
    mutation.mutate(next);
  }, [rules, mutation]);

  const disableAll = useCallback(() => {
    const next = rules.map((r) => ({ ...r, enabled: false }));
    mutation.mutate(next);
  }, [rules, mutation]);

  const resetRules = useCallback(() => {
    mutation.mutate(defaultNotificationRules);
  }, [mutation]);

  const isRuleEnabled = useCallback(
    (ruleId: string) => {
      const found = rules.find((r) => r.id === ruleId);
      return found ? found.enabled : true;
    },
    [rules]
  );

  return {
    rules,
    toggleRule,
    setCategoryEnabled,
    enableAll,
    disableAll,
    resetRules,
    isRuleEnabled,
  };
}
