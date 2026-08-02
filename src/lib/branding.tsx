import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import logoAsset from "@/assets/logo.png.asset.json";

export type Branding = {
  logoUrl: string;
  primary: string;
  accent: string;
  sidebar: string;
};

export const defaultBranding: Branding = {
  logoUrl: logoAsset.url,
  primary: "#E8791E",
  accent: "#6E6E73",
  sidebar: "#3A3A3F",
};

const STORAGE_KEY = "int-legal-branding";

/* ---------- color helpers (WCAG contrast) ---------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Picks black or white text so the pair always clears WCAG AA. */
export function readableOn(bg: string) {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#111114")
    ? "#ffffff"
    : "#111114";
}

function shade(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex);
  const mix = (v: number) =>
    Math.round(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Darkens (or lightens) a color until it reaches the required contrast on `bg`. */
export function ensureContrast(color: string, bg: string, ratio = 4.5) {
  const goDarker = luminance(bg) > 0.4;
  let out = color;
  for (let i = 0; i < 24 && contrastRatio(out, bg) < ratio; i++) {
    out = shade(out, goDarker ? -0.06 : 0.06);
  }
  return out;
}

/* ---------- context ---------- */

type Ctx = {
  branding: Branding;
  setBranding: (patch: Partial<Branding>) => void;
  reset: () => void;
};

const BrandingContext = createContext<Ctx>({
  branding: defaultBranding,
  setBranding: () => {},
  reset: () => {},
});

export function applyBranding(b: Branding) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const lightSurface = "#ffffff";

  root.style.setProperty("--primary", b.primary);
  root.style.setProperty("--primary-foreground", readableOn(b.primary));
  root.style.setProperty("--ring", b.primary);
  root.style.setProperty("--accent", b.accent);
  root.style.setProperty("--accent-foreground", readableOn(b.accent));
  root.style.setProperty("--sidebar", b.sidebar);
  root.style.setProperty("--sidebar-foreground", readableOn(b.sidebar));
  root.style.setProperty("--sidebar-primary", b.primary);
  root.style.setProperty("--sidebar-primary-foreground", readableOn(b.primary));
  root.style.setProperty("--sidebar-accent", shade(b.sidebar, 0.1));
  root.style.setProperty("--sidebar-accent-foreground", readableOn(b.sidebar));
  root.style.setProperty("--sidebar-border", shade(b.sidebar, 0.16));
  root.style.setProperty("--sidebar-ring", b.primary);
  root.style.setProperty("--chart-1", b.primary);
  root.style.setProperty("--chart-2", b.accent);

  // Text-safe variants used for labels, icons and pills on light surfaces.
  root.style.setProperty("--primary-ink", ensureContrast(b.primary, lightSurface));
  root.style.setProperty("--accent-ink", ensureContrast(b.accent, lightSurface));
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setState] = useState<Branding>(defaultBranding);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const next = raw ? { ...defaultBranding, ...JSON.parse(raw) } : defaultBranding;
      setState(next);
      applyBranding(next);
    } catch {
      applyBranding(defaultBranding);
    }
  }, []);

  const setBranding = useCallback((patch: Partial<Branding>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      applyBranding(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(defaultBranding);
    applyBranding(defaultBranding);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo(() => ({ branding, setBranding, reset }), [branding, setBranding, reset]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
