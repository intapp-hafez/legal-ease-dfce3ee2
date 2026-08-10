import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronRight, MessageSquarePlus } from "lucide-react";
import { PageShell, Panel, StatusPill } from "@/components/legal/PageShell";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/employee/tasks/$taskId")({
  component: TaskDetailsPage,
});

function TaskDetailsPage() {
  const router = useRouter();
  const { taskId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [newNote, setNewNote] = useState("");

  // Fetch task
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name),
          creator:profiles!tasks_created_by_fkey(full_name)
        `)
        .eq("id", taskId)
        .single();
        
      if (error) {
        console.error("Fetch with created_by failed. Did you run the SQL snippet?", error);
        // Fallback if SQL is not run yet
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("tasks")
          .select("*, assignee:profiles!tasks_assignee_id_fkey(full_name)")
          .eq("id", taskId)
          .single();
        
        if (fallbackError) throw fallbackError;
        return fallbackData;
      }
      return data;
    }
  });

  // Fetch notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["task-activities", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_activities")
        .select("*, profiles(full_name)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ newStatus, newProgress }: { newStatus: string, newProgress: number }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: newStatus, progress: newProgress })
        .eq("id", taskId)
        .select()
        .single();
      
      if (error) throw error;

      // Log activity
      await supabase.from("task_activities").insert({
        task_id: taskId,
        user_id: user?.id,
        content: `تم تغيير الحالة إلى: ${newStatus} (${newProgress}%)`,
        activity_type: "تغيير حالة"
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-activities", taskId] });
      queryClient.invalidateQueries({ queryKey: ["employee-tasks-page", user?.id] });
    }
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteText: string) => {
      const { data, error } = await supabase.from("task_activities").insert({
        task_id: taskId,
        user_id: user?.id,
        content: noteText,
        activity_type: "ملاحظة"
      }).select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-activities", taskId] });
      setNewNote("");
    }
  });

  const handleStatusChange = (newStatus: string) => {
    let newProgress = task?.progress || 0;
    if (newStatus === "جديدة") newProgress = 0;
    else if (newStatus === "مكتملة") newProgress = 100;
    else if (newStatus === "قيد التنفيذ" && newProgress === 0) newProgress = 50;

    updateStatusMutation.mutate({ newStatus, newProgress });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote);
  };

  if (taskLoading) {
    return (
      <PageShell title="جاري التحميل..." description="جاري تحميل تفاصيل المهمة">
        <div className="py-8 text-center text-sm text-muted-foreground">الرجاء الانتظار...</div>
      </PageShell>
    );
  }

  if (!task) {
    return (
      <PageShell title="مهمة غير موجودة" description="لم يتم العثور على المهمة المطلوبة">
        <button onClick={() => router.history.back()} className="text-primary underline">العودة</button>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={task.title}
      description={`تفاصيل المهمة رقم ${task.no}`}
      actions={
        <button 
          onClick={() => router.history.back()}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="size-4" />
          العودة للمهام
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task Details Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Panel title="معلومات المهمة">

            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">رقم المهمة:</span>
                <span className="font-medium text-primary">{task.no}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">المنشئ (مفوضة من):</span>
                <span className="font-medium">{task.creator?.full_name || "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">المسؤول (مسندة إلى):</span>
                <span className="font-medium">{task.assignee?.full_name || "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">الأولوية:</span>
                <span className="font-medium">{task.priority || "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">تاريخ الاستحقاق:</span>
                <span className="font-medium">{task.due_date || "—"}</span>
              </div>
              {task.description && (
                <div className="flex flex-col gap-2 border-b pb-2">
                  <span className="text-muted-foreground">التفاصيل:</span>
                  <p className="font-medium whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
              <div className="flex justify-between border-b pb-2 items-center">
                <span className="text-muted-foreground">الحالة:</span>
                {updateStatusMutation.isPending ? (
                  <span className="text-xs text-muted-foreground">جاري التحديث...</span>
                ) : (
                  <StatusPill 
                    value={task.status} 
                    onChange={handleStatusChange}
                    options={["جديدة", "قيد التنفيذ", "بانتظار", "متأخرة", "مكتملة"]}
                  />
                )}
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-muted-foreground">نسبة الإنجاز: {task.progress}%</span>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Notes Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Panel title="الملاحظات والنشاطات" subtitle="إضافة وعرض الملاحظات وتحديثات المهمة">
            
            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="mb-6 flex flex-col gap-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="اكتب ملاحظة جديدة هنا..."
                disabled={addNoteMutation.isPending}
                className="min-h-[100px] w-full rounded-lg border bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <MessageSquarePlus className="size-4" />
                  {addNoteMutation.isPending ? "جاري الإضافة..." : "إضافة ملاحظة"}
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-4">
              {notesLoading ? (
                 <div className="text-center text-sm text-muted-foreground py-4">جاري تحميل النشاطات...</div>
              ) : notes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  لا توجد ملاحظات أو نشاطات لهذه المهمة بعد.
                </div>
              ) : (
                notes.map((note: any) => (
                  <div key={note.id} className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-sm text-primary">
                        {note.profiles?.full_name || "النظام"}
                        {note.activity_type === "تغيير حالة" && (
                          <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full text-foreground">تحديث حالة</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString("ar-SA")}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
