"use client";

import { createContext, useContext, useEffect } from "react";
import { hexToRgb, darkenHex } from "@/lib/settings-constants";
import type { SiteSettingsData } from "@/lib/settings-constants";

const SiteSettingsContext = createContext<SiteSettingsData | null>(null);

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return ctx;
}

export default function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettingsData;
  children: React.ReactNode;
}) {
  // Apply accent color CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const hex = settings.accentColor || "#00ff41";
    const [r, g, b] = hexToRgb(hex);

    root.style.setProperty("--accent-color", hex);
    root.style.setProperty("--accent-dim", darkenHex(hex, 0.2));
    root.style.setProperty("--accent-dark", darkenHex(hex, 0.4));
    root.style.setProperty("--neon-rgb", `${r}, ${g}, ${b}`);
  }, [settings.accentColor]);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
