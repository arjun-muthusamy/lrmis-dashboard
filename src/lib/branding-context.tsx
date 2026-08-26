import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "@/lib/auth-context";

export type BrandingSettings = {
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
  fontFamily: FontKey;
};

export const FONT_OPTIONS = {
  inter: { label: "Inter", value: '"Inter", ui-sans-serif, system-ui, sans-serif' },
  publicSans: {
    label: "Public Sans",
    value: '"Public Sans", ui-sans-serif, system-ui, sans-serif',
  },
  sourceSans: {
    label: "Source Sans 3",
    value: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
  },
  nunitoSans: {
    label: "Nunito Sans",
    value: '"Nunito Sans", ui-sans-serif, system-ui, sans-serif',
  },
} as const;

export type FontKey = keyof typeof FONT_OPTIONS;

export const DEFAULT_BRANDING: BrandingSettings = {
  primaryColor: "#0F2D56",
  accentColor: "#0B7B8A",
  sidebarColor: "#FFFFFF",
  fontFamily: "inter",
};

type BrandingContextValue = {
  draft: BrandingSettings;
  saved: BrandingSettings;
  updateDraft: (updates: Partial<BrandingSettings>) => void;
  apply: () => void;
  cancel: () => void;
  reset: () => void;
  isDirty: boolean;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);
const storageKey = (username: string) => `lrmis_branding:${username}`;
const validHex = /^#[0-9A-Fa-f]{6}$/;
const APPROVED_DARK_FOREGROUND = "#000000";
const APPROVED_LIGHT_FOREGROUND = "#FFFFFF";

function parseSettings(raw: string | null): BrandingSettings {
  if (!raw) return DEFAULT_BRANDING;
  try {
    const candidate = JSON.parse(raw) as Partial<BrandingSettings>;
    return {
      primaryColor: validHex.test(candidate.primaryColor ?? "")
        ? candidate.primaryColor!.toUpperCase()
        : DEFAULT_BRANDING.primaryColor,
      accentColor: validHex.test(candidate.accentColor ?? "")
        ? candidate.accentColor!.toUpperCase()
        : DEFAULT_BRANDING.accentColor,
      sidebarColor: validHex.test(candidate.sidebarColor ?? "")
        ? candidate.sidebarColor!.toUpperCase()
        : DEFAULT_BRANDING.sidebarColor,
      fontFamily:
        candidate.fontFamily && candidate.fontFamily in FONT_OPTIONS
          ? candidate.fontFamily
          : DEFAULT_BRANDING.fontFamily,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

function mix(hex: string, target: string, amount: number) {
  const rgb = hex.match(/\w\w/g)?.map((x) => Number.parseInt(x, 16)) ?? [15, 45, 86];
  const to = target.match(/\w\w/g)?.map((x) => Number.parseInt(x, 16)) ?? [255, 255, 255];
  return `#${rgb
    .map((v, i) =>
      Math.round(v + (to[i] - v) * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function relativeLuminance(hex: string) {
  const channels = hex.match(/\w\w/g)?.map((channel) => Number.parseInt(channel, 16) / 255) ?? [
    15 / 255,
    45 / 255,
    86 / 255,
  ];
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4),
  );

  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastRatio(foreground: string, background: string) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function getBrandForeground(background: string) {
  return contrastRatio(APPROVED_DARK_FOREGROUND, background) >=
    contrastRatio(APPROVED_LIGHT_FOREGROUND, background)
    ? APPROVED_DARK_FOREGROUND
    : APPROVED_LIGHT_FOREGROUND;
}

function applyTheme(settings: BrandingSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", settings.primaryColor);
  root.style.setProperty("--primary-foreground", getBrandForeground(settings.primaryColor));
  root.style.setProperty("--navy", settings.primaryColor);
  root.style.setProperty("--navy-foreground", getBrandForeground(settings.primaryColor));
  root.style.setProperty("--teal", settings.accentColor);
  root.style.setProperty("--teal-foreground", getBrandForeground(settings.accentColor));
  root.style.setProperty("--teal-soft", mix(settings.accentColor, "#ffffff", 0.9));
  root.style.setProperty("--accent", mix(settings.accentColor, "#ffffff", 0.88));
  root.style.setProperty(
    "--accent-foreground",
    getBrandForeground(mix(settings.accentColor, "#ffffff", 0.88)),
  );
  root.style.setProperty("--ring", settings.accentColor);
  // A light sidebar needs its hover/active tint and border darkened slightly for
  // visibility, while a (user-chosen) dark sidebar keeps the original lightened mix.
  const sidebarIsLight = getBrandForeground(settings.sidebarColor) === APPROVED_DARK_FOREGROUND;
  const sidebarAccent = sidebarIsLight
    ? mix(settings.sidebarColor, "#000000", 0.06)
    : mix(settings.sidebarColor, "#ffffff", 0.1);
  const sidebarBorder = sidebarIsLight
    ? mix(settings.sidebarColor, "#000000", 0.12)
    : mix(settings.sidebarColor, "#ffffff", 0.14);

  root.style.setProperty("--sidebar", settings.sidebarColor);
  root.style.setProperty("--sidebar-foreground", getBrandForeground(settings.sidebarColor));
  root.style.setProperty("--sidebar-primary", settings.accentColor);
  root.style.setProperty("--sidebar-primary-foreground", getBrandForeground(settings.accentColor));
  root.style.setProperty("--sidebar-accent", sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", getBrandForeground(sidebarAccent));
  root.style.setProperty("--sidebar-border", sidebarBorder);
  root.style.setProperty("--sidebar-ring", settings.accentColor);
  root.style.setProperty("--font-sans", FONT_OPTIONS[settings.fontFamily].value);
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const username = user?.username;
  const [saved, setSaved] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [draft, setDraft] = useState<BrandingSettings>(DEFAULT_BRANDING);

  useEffect(() => {
    let settings = DEFAULT_BRANDING;
    if (username && typeof window !== "undefined") {
      try {
        settings = parseSettings(window.localStorage.getItem(storageKey(username)));
      } catch {
        settings = DEFAULT_BRANDING;
      }
    }
    setSaved(settings);
    setDraft(settings);
  }, [username]);

  useEffect(() => {
    applyTheme(draft);
  }, [draft]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      draft,
      saved,
      updateDraft: (updates) => setDraft((current) => ({ ...current, ...updates })),
      apply: () => {
        setSaved(draft);
        if (username && typeof window !== "undefined") {
          try {
            window.localStorage.setItem(storageKey(username), JSON.stringify(draft));
          } catch {
            /* Keep the current in-memory branding when storage is unavailable. */
          }
        }
      },
      cancel: () => setDraft(saved),
      reset: () => setDraft(DEFAULT_BRANDING),
      isDirty: JSON.stringify(draft) !== JSON.stringify(saved),
    }),
    [draft, saved, username],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) throw new Error("useBranding must be inside BrandingProvider");
  return context;
}

export function isBrandColor(value: string) {
  return validHex.test(value);
}
