import { useState } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBranding } from "@/lib/branding";

export function LoginScreen() {
  const { login } = useAuth();
  const { branding } = useBranding();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await login(username, password);
    if (!res.ok) setError(res.error ?? "تعذّر تسجيل الدخول");
    else setError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-panel)]">
        <div className="flex items-center gap-3 border-b border-border pb-5">
          <span className="flex size-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-1">
            <img src={branding.logoUrl} alt="شعار الشركة" className="h-full w-full object-contain" />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold text-card-foreground">
              نظام INT القانوني
            </h1>
            <p className="text-xs text-muted-foreground">تسجيل الدخول إلى لوحة الشؤون القانونية</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-foreground">اسم المستخدم</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="superadmin"
            />
          </label>

          <div className="block">
            <span className="mb-1.5 block text-xs font-medium text-foreground">كلمة المرور</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                placeholder="••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 rounded-lg"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <LogIn className="size-4" />
            دخول
          </button>
        </form>


      </div>
    </div>
  );
}
