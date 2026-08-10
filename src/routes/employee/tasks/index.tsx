import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { PageShell, Panel, StatusPill, DataTable } from "@/components/legal/PageShell";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useOptionList } from "@/lib/option-lists";
import { SearchSelect } from "@/components/legal/SearchSelect";
import { useProfilesOptions } from "@/lib/useSupabase";

export const Route = createFileRoute("/employee/tasks/")({
  head: () => ({
    meta: [{ title: "المهام اليومية — نظام INT القانوني" }],
  }),
  component: EmployeeTasksPage,
});

const baseCategories = [
  "إعداد عقود",
  "مراجعة عقود",
  "حضور جلسات",
  "مراجعات حكومية",
  "تجديد تراخيص",
  "تحقيق موظفين",
  "استشارة قانونية",
];

function EmployeeTasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { options: categories, add: addCategory } = useOptionList("task-categories", baseCategories);
  const profilesOptions = useProfilesOptions();

  const [activeTab, setActiveTab] = useState<"own" | "assigned_to_me" | "delegated">("assigned_to_me");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", category: categories[0] || "", priority: "متوسطة", due_date: "", assignee_id: user?.id || "" });
  const [error, setError] = useState<string | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["employee-tasks-page", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Try fetching with created_by (requires the SQL migration)
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name, department),
          creator:profiles!tasks_created_by_fkey(full_name, department)
        `)
        .or(`assignee_id.eq.${user?.id},created_by.eq.${user?.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch with created_by failed. Did you run the SQL snippet?", error);
        setFetchError(`لم يتم العثور على حقل المنشئ، هل قمت بتشغيل كود SQL؟ تفاصيل الخطأ: ${error.message || error.details || JSON.stringify(error)}`);
        // Fallback if SQL is not run yet
        const { data: fallbackData } = await supabase
          .from("tasks")
          .select("*, assignee:profiles!tasks_assignee_id_fkey(full_name, department)")
          .eq("assignee_id", user?.id)
          .order("created_at", { ascending: false });
        return fallbackData || [];
      }
      setFetchError(null);
      return data || [];
    }
  });

  // Tasks created by the user for themselves
  const ownTasks = tasks?.filter((t: any) => t.assignee_id === user?.id && t.created_by === user?.id) || [];
  // Tasks assigned to the user by someone else (e.g., admin)
  const assignedToMeTasks = tasks?.filter((t: any) => t.assignee_id === user?.id && t.created_by !== user?.id) || [];
  // Tasks created by the user and assigned to someone else
  const delegatedTasks = tasks?.filter((t: any) => t.created_by === user?.id && t.assignee_id !== user?.id) || [];

  const createMutation = useMutation({
    mutationFn: async (newTask: any) => {
      // Generate a random 4-digit number to avoid collisions from RLS hiding rows
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      const nextNo = `TSK-${randomNum}`;

      const { data, error } = await supabase.from("tasks").insert({
        no: nextNo,
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
        assignee_id: newTask.assignee_id || user?.id,
        created_by: user?.id,
        status: "جديدة",
        progress: 0,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-tasks-page", user?.id] });
      setOpen(false);
      setDraft({ title: "", description: "", category: categories[0] || "", priority: "متوسطة", due_date: "", assignee_id: user?.id || "" });
      setError(null);
    },
    onError: (e: any) => {
      setError(e.message || "حدث خطأ أثناء إضافة المهمة (تأكد من تشغيل كود SQL)");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError("يرجى إدخال عنوان المهمة");
      return;
    }
    createMutation.mutate(draft);
  };
  
  return (
    <PageShell
      title="المهام اليومية"
      description="قائمة المهام المسندة إليك والمهام التي قمت بتفويضها للآخرين."
      actions={
        <button
          onClick={() => {
            setDraft((d) => ({ ...d, assignee_id: user?.id || "" }));
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          مهمة جديدة
        </button>
      }
    >
      {fetchError && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive">
          <p className="font-bold">تنبيه:</p>
          <p>{fetchError}</p>
        </div>
      )}
      <div className="space-y-5">
        <div className="flex gap-4 border-b border-border">
          <button
            onClick={() => setActiveTab("assigned_to_me")}
            className={`pb-3 pt-1 text-sm font-medium transition-all ${
              activeTab === "assigned_to_me"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            مهام مسندة إليّ ({assignedToMeTasks.length})
          </button>
          <button
            onClick={() => setActiveTab("own")}
            className={`pb-3 pt-1 text-sm font-medium transition-all ${
              activeTab === "own"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            مهامي الخاصة ({ownTasks.length})
          </button>
          <button
            onClick={() => setActiveTab("delegated")}
            className={`pb-3 pt-1 text-sm font-medium transition-all ${
              activeTab === "delegated"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            مهام صادرة / مفوضة ({delegatedTasks.length})
          </button>
        </div>

        {activeTab === "assigned_to_me" ? (
          <Panel title="المهام المسندة إليّ" subtitle="المهام التي تم إسنادها لك من قبل الإدارة أو مستخدمين آخرين.">
            {isLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">جاري تحميل المهام...</div>
            ) : assignedToMeTasks.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">لا توجد مهام مسندة إليك من الآخرين حالياً.</div>
            ) : (
              <DataTable
                columns={["المهمة", "المنشئ", "الإدارة", "التاريخ", "الحالة"]}
                onRowClick={(i) => router.navigate({ to: `/employee/tasks/${assignedToMeTasks[i]?.id}` })}
                rows={assignedToMeTasks.map((t: any) => [
                  <span key="title" className="font-medium">{t.title}</span>,
                  <span key="creator" className="font-medium text-primary">{t.creator?.full_name || "غير محدد"}</span>,
                  <span key="dept" className="text-muted-foreground">{t.creator?.department || "—"}</span>,
                  <span key="date" className="text-muted-foreground text-sm">{new Date(t.created_at).toLocaleDateString("en-GB")}</span>,
                  <StatusPill key="status" value={t.status} />,
                ])}
              />
            )}
          </Panel>
        ) : activeTab === "own" ? (
          <Panel title="مهامي الخاصة" subtitle="المهام التي قمت بإنشائها لنفسك. انقر على المهمة لعرض التفاصيل.">
            {isLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">جاري تحميل المهام...</div>
            ) : ownTasks.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">لا توجد مهام خاصة بك حالياً.</div>
            ) : (
              <DataTable
                columns={["المهمة", "الأولوية", "التاريخ", "الحالة", "الإنجاز"]}
                onRowClick={(i) => router.navigate({ to: `/employee/tasks/${ownTasks[i]?.id}` })}
                rows={ownTasks.map((t: any) => [
                  <span key="title" className="font-medium">{t.title}</span>,
                  <span key="priority" className="text-muted-foreground">{t.priority}</span>,
                  <span key="date" className="text-muted-foreground text-sm">{new Date(t.created_at).toLocaleDateString("en-GB")}</span>,
                  <StatusPill key="status" value={t.status} />,
                  <div key="progress" className="flex items-center gap-2">
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${t.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{t.progress || 0}%</span>
                  </div>,
                ])}
              />
            )}
          </Panel>
        ) : (
          <Panel title="المهام الصادرة" subtitle="المهام التي قمت بتفويضها وإسنادها لآخرين.">
            {isLoading ? (
              <div className="py-4 text-center text-sm text-muted-foreground">جاري تحميل المهام...</div>
            ) : delegatedTasks.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">لم تقم بإسناد أي مهام للآخرين.</div>
            ) : (
              <DataTable
                columns={["المهمة", "المسند إليه", "الإدارة", "التاريخ", "الحالة"]}
                onRowClick={(i) => router.navigate({ to: `/employee/tasks/${delegatedTasks[i]?.id}` })}
                rows={delegatedTasks.map((t: any) => [
                  <span key="title" className="font-medium">{t.title}</span>,
                  <span key="assignee" className="font-medium text-primary">{t.assignee?.full_name || "غير محدد"}</span>,
                  <span key="dept" className="text-muted-foreground">{t.assignee?.department || "—"}</span>,
                  <span key="date" className="text-muted-foreground text-sm">{new Date(t.created_at).toLocaleDateString("en-GB")}</span>,
                  <StatusPill key="status" value={t.status} />,
                ])}
              />
            )}
          </Panel>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-bold">إضافة مهمة جديدة</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-secondary">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</div>}
              
              <div>
                <label className="mb-1 block text-sm font-medium">عنوان المهمة *</label>
                <input 
                  autoFocus
                  className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" 
                  value={draft.title} 
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })} 
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">التفاصيل</label>
                <textarea 
                  className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]" 
                  value={draft.description} 
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <SearchSelect 
                    label="التصنيف"
                    allLabel="كل التصنيفات"
                    value={draft.category} 
                    onChange={(val) => setDraft({ ...draft, category: val })}
                    options={categories}
                    onAddOption={addCategory}
                    addLabel="إضافة تصنيف جديد"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">الأولوية</label>
                  <select 
                    className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" 
                    value={draft.priority} 
                    onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                  >
                    <option value="منخفضة">منخفضة</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="عالية">عالية</option>
                    <option value="عاجلة">عاجلة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">المسؤول (إسناد إلى)</label>
                  <select 
                    className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" 
                    value={draft.assignee_id} 
                    onChange={(e) => setDraft({ ...draft, assignee_id: e.target.value })}
                  >
                    <option value={user?.id || ""}>أنا (نفسي)</option>
                    {profilesOptions.filter(p => p.value !== user?.id).map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">تاريخ الاستحقاق</label>
                  <input 
                    type="date"
                    className="w-full rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary/50" 
                    value={draft.due_date} 
                    onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary">
                  إلغاء
                </button>
                <button disabled={createMutation.isPending} type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {createMutation.isPending ? "جاري الحفظ..." : "حفظ المهمة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

