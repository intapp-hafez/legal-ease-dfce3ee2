import React, { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type DeleteFolderModalProps = {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
  folderName: string;
};

export function DeleteFolderModal({ open, onClose, folderId, folderName }: DeleteFolderModalProps) {
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  if (!open || !folderId) return null;

  const handleDelete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("repository").delete().eq("id", folderId);
      if (error) throw error;
      
      toast.success("تم الحذف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["repository"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الحذف");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm">
      <div 
        className="animate-in fade-in zoom-in-95 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
              <Trash2 className="size-5 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-card-foreground">
              تأكيد الحذف
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                هل أنت متأكد من حذف "{folderName}"؟
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                سيتم حذف هذا العنصر نهائياً ولا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleDelete}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {saving ? "جاري الحذف..." : "نعم، احذف"}
          </button>
        </div>
      </div>
    </div>
  );
}
