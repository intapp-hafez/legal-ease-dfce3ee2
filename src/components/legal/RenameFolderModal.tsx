import React, { useState, useEffect } from "react";
import { X, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type RenameFolderModalProps = {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
  currentName: string;
};

export function RenameFolderModal({ open, onClose, folderId, currentName }: RenameFolderModalProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setName(currentName || "");
    }
  }, [open, currentName]);

  if (!open || !folderId) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("يرجى إدخال اسم المجلد");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("repository")
        .update({ name: name.trim() })
        .eq("id", folderId);
        
      if (error) throw error;
      
      toast.success("تم إعادة تسمية المجلد بنجاح");
      queryClient.invalidateQueries({ queryKey: ["repository"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إعادة تسمية المجلد");
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
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Pencil className="size-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-card-foreground">
              إعادة تسمية المجلد
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
          <label className="mb-2 block text-sm font-medium text-muted-foreground">
            اسم المجلد الجديد
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            autoFocus
            className="h-10 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
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
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </div>
  );
}
