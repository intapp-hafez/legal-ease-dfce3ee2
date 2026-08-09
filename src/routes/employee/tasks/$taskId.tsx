import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ChevronRight, MessageSquarePlus } from "lucide-react";
import { PageShell, Panel, StatusPill } from "@/components/legal/PageShell";
import { employeeTasks } from "@/lib/legal-data";

export const Route = createFileRoute("/employee/tasks/$taskId")({
  component: TaskDetailsPage,
});

function TaskDetailsPage() {
  const router = useRouter();
  const { taskId } = Route.useParams();
  const task = employeeTasks.find((t) => t.id === taskId);
  const [notes, setNotes] = useState(task?.notes || []);
  const [newNote, setNewNote] = useState("");
  const [status, setStatus] = useState(task?.status || "");
  const [progress, setProgress] = useState(task?.progress || 0);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (newStatus === "جديدة") setProgress(0);
    else if (newStatus === "مكتملة") setProgress(100);
    else if (newStatus === "قيد التنفيذ" && progress === 0) setProgress(50);
  };

  if (!task) {
    return (
      <PageShell title="مهمة غير موجودة" description="لم يتم العثور على المهمة المطلوبة">
        <button onClick={() => router.history.back()} className="text-primary underline">العودة</button>
      </PageShell>
    );
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    const note = {
      id: Math.random().toString(),
      text: newNote,
      date: new Date().toLocaleDateString("ar-EG") + " " + new Date().toLocaleTimeString("ar-EG"),
    };
    
    setNotes([note, ...notes]);
    // In a real app we would update the backend/global state here.
    // task.notes.push(note) is mutated locally for prototype purposes if needed, 
    // but state handles UI updates here.
    setNewNote("");
  };

  return (
    <PageShell
      title={task.title}
      description={`تفاصيل المهمة رقم ${task.id}`}
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
                <span className="font-medium text-primary">{task.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">الأولوية:</span>
                <span className="font-medium">{task.priority}</span>
              </div>
              <div className="flex justify-between border-b pb-2 items-center">
                <span className="text-muted-foreground">الحالة:</span>
                <StatusPill 
                  value={status} 
                  onChange={handleStatusChange}
                  options={["جديدة", "قيد التنفيذ", "بانتظار", "متأخرة", "مكتملة"]}
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-muted-foreground">نسبة الإنجاز: {progress}%</span>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* Notes Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Panel title="الملاحظات" subtitle="إضافة وعرض ملاحظات المهمة">
            
            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="mb-6 flex flex-col gap-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="اكتب ملاحظة جديدة هنا..."
                className="min-h-[100px] w-full rounded-lg border bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <MessageSquarePlus className="size-4" />
                  إضافة ملاحظة
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-4">
              {notes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  لا توجد ملاحظات لهذه المهمة بعد.
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="rounded-lg border bg-card p-4 shadow-sm">
                    <p className="whitespace-pre-wrap text-sm">{note.text}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{note.date}</p>
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
