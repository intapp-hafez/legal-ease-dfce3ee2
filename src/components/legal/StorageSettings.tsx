import { useState, useEffect } from "react";
import { Database, HardDrive, Save, Server, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function StorageSettings() {
  const [storageType, setStorageType] = useState<"database" | "local">("database");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "storage-path")
          .maybeSingle();
        
        if (!error && data?.value) {
          setStorageType(data.value as "database" | "local");
        }
      } catch (err) {
        console.error("Failed to load storage setting:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("settings").upsert({
        key: "storage-path",
        value: storageType,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

      if (error) throw error;
      toast.success("تم حفظ إعدادات التخزين بنجاح");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 rounded-xl bg-card border border-border"></div>;
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <HardDrive className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">مسار تخزين المستندات</h2>
            <p className="text-sm text-muted-foreground">قم بتحديد المكان الذي سيتم فيه حفظ جميع الملفات المرفوعة للنظام</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Option 1: Database */}
          <div 
            onClick={() => setStorageType("database")}
            className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-5 transition-all ${
              storageType === "database" 
                ? "border-primary bg-primary/5" 
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            {storageType === "database" && (
              <div className="absolute top-4 left-4 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ShieldCheck className="size-3.5" />
              </div>
            )}
            <Database className={`mb-3 size-8 ${storageType === "database" ? "text-primary" : "text-muted-foreground"}`} />
            <h3 className="mb-1 font-semibold">تخزين في قاعدة البيانات</h3>
            <p className="text-sm text-muted-foreground">
              يتم حفظ الملفات بشكل آمن داخل قواعد البيانات (Supabase). مناسب للملفات الصغيرة والمتوسطة.
            </p>
          </div>

          {/* Option 2: Local Server */}
          <div 
            onClick={() => setStorageType("local")}
            className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-5 transition-all ${
              storageType === "local" 
                ? "border-primary bg-primary/5" 
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            {storageType === "local" && (
              <div className="absolute top-4 left-4 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ShieldCheck className="size-3.5" />
              </div>
            )}
            <Server className={`mb-3 size-8 ${storageType === "local" ? "text-primary" : "text-muted-foreground"}`} />
            <h3 className="mb-1 font-semibold">تخزين محلي (الخادم)</h3>
            <p className="text-sm text-muted-foreground">
              يتم حفظ الملفات في مجلد <code className="bg-background px-1 py-0.5 rounded text-xs border border-border">/documents</code> على الخادم الفعلي.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/20 px-6 py-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? (
            "جاري الحفظ..."
          ) : (
            <>
              <Save className="size-4" /> حفظ الإعدادات
            </>
          )}
        </button>
      </div>
    </div>
  );
}
