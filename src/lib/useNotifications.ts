import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["notifications", user?.id];

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      // 1. Fetch DB notifications
      const { data: dbData, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) {
        console.error("Error fetching notifications:", error);
      }

      let allNotifs = (dbData || []) as Notification[];

      // 2. Fetch documents for reminders
      const { data: docs } = await supabase
        .from("documents")
        .select("id, no, name, expiry_date, remind_days, status")
        .neq("status", "منتهي")
        .not("expiry_date", "is", null)
        .not("remind_days", "is", null);

      if (docs) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const readDyn = JSON.parse(localStorage.getItem("read_dyn_notifs") || "{}");

        docs.forEach((doc: any) => {
          if (!doc.expiry_date || !doc.remind_days) return;
          const expDate = new Date(doc.expiry_date);
          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays <= doc.remind_days && diffDays >= -30) {
            const id = `dyn-doc-${doc.id}`;
            const isExpired = diffDays < 0;
            const daysText = Math.abs(diffDays);
            
            allNotifs.push({
              id,
              user_id: user.id,
              title: isExpired ? "مستند منتهي" : "تذكير: مستند شارف على الانتهاء",
              message: isExpired 
                ? `المستند "${doc.name}" انتهى منذ ${daysText} يوم.`
                : `المستند "${doc.name}" سينتهي بعد ${daysText} يوم.`,
              link: "/documents",
              is_read: !!readDyn[id],
              created_at: new Date(today.getTime() + diffDays * 1000).toISOString(), // just to give it a stable date
            });
          }
        });
      }

      // Sort combined
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
          filter: `user_id=eq.${user.id}`,
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

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("dyn-")) {
        const readDyn = JSON.parse(localStorage.getItem("read_dyn_notifs") || "{}");
        readDyn[id] = true;
        localStorage.setItem("read_dyn_notifs", JSON.stringify(readDyn));
        return;
      }
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Mark dynamic ones as read
      const dynUnread = notifications.filter(n => !n.is_read && n.id.startsWith("dyn-"));
      if (dynUnread.length > 0) {
        const readDyn = JSON.parse(localStorage.getItem("read_dyn_notifs") || "{}");
        dynUnread.forEach(n => readDyn[n.id] = true);
        localStorage.setItem("read_dyn_notifs", JSON.stringify(readDyn));
      }

      // Mark DB ones as read
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAsRead = (id: string) => markAsReadMutation.mutate(id);
  const markAllAsRead = () => markAllAsReadMutation.mutate();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
  };
}
