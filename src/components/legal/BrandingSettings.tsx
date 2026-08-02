import { useRef } from "react";
import { RotateCcw, Upload } from "lucide-react";
import { Panel } from "./PageShell";
import { contrastRatio, ensureContrast, useBranding } from "@/lib/branding";

const fields = [
  { key: "primary", label: "اللون الأساسي (العلامة التجارية)" },
  { key: "accent", label: "اللون الثانوي" },
  { key: "sidebar", label: "لون القائمة الجانبية" },
] as const;

function ContrastBadge({ color }: { color: string }) {
  const safe = ensureContrast(color, "#ffffff");
  const ratio = contrastRatio(safe, "#ffffff");
  return (
    <span className="text-[11px] text-muted-foreground">
      تباين النص: {ratio.toFixed(1)}:1 — {ratio >= 4.5 ? "مطابق AA" : "غير مطابق"}
    </span>
  );
}

export function BrandingSettings() {
  const { branding, setBranding, reset } = useBranding();
  const fileRef = useRef<HTMLInputElement>(null);

  const onLogo = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBranding({ logoUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <Panel
      title="الهوية البصرية (للمسؤولين)"
      subtitle="تغيير الشعار وألوان النظام دون تعديل الكود — تُحفظ محليًا على هذا الجهاز"
      action={
        <button
          onClick={reset}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground hover:bg-secondary"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" /> استعادة الافتراضي
        </button>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">شعار الشركة</p>
          <div className="flex items-center gap-3">
            <span className="flex size-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-card p-1.5">
              <img
                src={branding.logoUrl}
                alt="الشعار الحالي للنظام"
                className="h-full w-full object-contain"
              />
            </span>
            <div className="space-y-1.5">
              <input
                ref={fileRef}
                id="branding-logo"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="sr-only"
                onChange={(e) => onLogo(e.target.files?.[0])}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Upload className="size-4" aria-hidden="true" /> رفع شعار جديد
              </button>
              <p className="text-[11px] text-muted-foreground">PNG أو SVG بخلفية شفافة، مربّع الأبعاد.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key} className="flex items-center justify-between gap-3">
              <label htmlFor={`color-${f.key}`} className="text-xs font-medium text-foreground">
                {f.label}
                <span className="mt-0.5 block font-normal">
                  <ContrastBadge color={branding[f.key]} />
                </span>
              </label>
              <span className="flex items-center gap-2">
                <input
                  id={`color-${f.key}`}
                  type="color"
                  value={branding[f.key]}
                  onChange={(e) => setBranding({ [f.key]: e.target.value })}
                  className="size-11 cursor-pointer rounded-md border border-border bg-card p-1"
                />
                <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                  {branding[f.key].toUpperCase()}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/60 p-3">
        <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
          زر أساسي
        </span>
        <span className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-[var(--accent-ink)]-foreground">
          زر ثانوي
        </span>
        <span className="rounded-md border border-[var(--primary-ink)]/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-[var(--primary-ink)]">
          وسم بالهوية
        </span>
        <span className="text-xs text-muted-foreground">معاينة مباشرة للألوان المختارة</span>
      </div>
    </Panel>
  );
}
