import React, { useState, useEffect } from "react";
import { X, Users, Search, Check, Shield, Building2 } from "lucide-react";
import { useProfilesOptions } from "@/lib/useSupabase";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type ShareFolderModalProps = {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
  folderName: string;
  initialSharedWith: string[];
  initialSharedDepartments: string[];
};

const DEPARTMENTS = [
  "الموارد البشرية",
  "المالية",
  "الشؤون القانونية",
  "تقنية المعلومات",
  "التسويق",
  "المبيعات",
  "العمليات",
];

export function ShareFolderModal({ open, onClose, folderId, folderName, initialSharedWith, initialSharedDepartments }: ShareFolderModalProps) {
  const [activeTab, setActiveTab] = useState<"employees" | "departments">("employees");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const profilesOptions = useProfilesOptions();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setSelectedIds(initialSharedWith || []);
      setSelectedDepts(initialSharedDepartments || []);
      setSearch("");
      setActiveTab("employees");
    }
  }, [open, initialSharedWith, initialSharedDepartments]);

  if (!open || !folderId) return null;

  const filteredOptions = profilesOptions.filter((opt) => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredDepts = DEPARTMENTS.filter(d => d.includes(search));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  
  const toggleDept = (dept: string) => {
    setSelectedDepts((prev) => 
      prev.includes(dept) ? prev.filter((x) => x !== dept) : [...prev, dept]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("repository")
        .update({ 
          shared_with: selectedIds,
          shared_departments: selectedDepts
        })
        .eq("id", folderId);
        
      if (error) throw error;
      
      toast.success("تم تحديث صلاحيات المشاركة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["repository"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ المشاركة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm">
      <div 
        className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                مشاركة المجلد
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {folderName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-6 pb-0">
          <button
            onClick={() => setActiveTab("employees")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "employees" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Users className="inline-block size-4 ml-2" />
            الموظفين
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === "departments" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Building2 className="inline-block size-4 ml-2" />
            الأقسام
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-primary-ink font-medium">
            <Shield className="size-4 shrink-0 text-primary" />
            <span>
              يمكن لمدراء النظام الوصول لجميع المجلدات تلقائياً حتى وإن لم يتم تحديدهم هنا.
            </span>
          </div>

          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`البحث عن ${activeTab === "employees" ? "موظف" : "قسم"}...`}
              className="h-10 w-full rounded-lg border border-border bg-background pr-10 pl-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === "employees" && (
              filteredOptions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  لم يتم العثور على موظفين
                </p>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = selectedIds.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleSelect(opt.value)}
                      className={`flex items-center justify-between rounded-lg border p-3 text-right transition-colors ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent hover:bg-secondary"
                      }`}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                      <div className={`flex size-5 items-center justify-center rounded border ${
                        isSelected 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-input bg-background"
                      }`}>
                        {isSelected && <Check className="size-3.5" />}
                      </div>
                    </button>
                  );
                })
              )
            )}

            {activeTab === "departments" && (
              filteredDepts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  لم يتم العثور على أقسام
                </p>
              ) : (
                filteredDepts.map((dept) => {
                  const isSelected = selectedDepts.includes(dept);
                  return (
                    <button
                      key={dept}
                      onClick={() => toggleDept(dept)}
                      className={`flex items-center justify-between rounded-lg border p-3 text-right transition-colors ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent hover:bg-secondary"
                      }`}
                    >
                      <span className="text-sm font-medium">{dept}</span>
                      <div className={`flex size-5 items-center justify-center rounded border ${
                        isSelected 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-input bg-background"
                      }`}>
                        {isSelected && <Check className="size-3.5" />}
                      </div>
                    </button>
                  );
                })
              )
            )}
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
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </div>
  );
}
