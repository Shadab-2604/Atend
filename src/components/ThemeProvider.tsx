"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "mono-dark" | "mono-light" | "mono-charcoal" | "mono-alabaster";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  badge: string;
  description: string;
  accentHex: string;
  bgHex: string;
  borderHex: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "mono-dark",
    name: "Monochrome Noir",
    badge: "Pitch Dark",
    description: "Deep black canvas with pure white typography and hairline contrast",
    accentHex: "#ffffff",
    bgHex: "#000000",
    borderHex: "#27272a",
    isDark: true,
  },
  {
    id: "mono-light",
    name: "Minimal Stark Light",
    badge: "Pure Crisp",
    description: "Clean pure white backdrop with sharp ink-black text and razor borders",
    accentHex: "#000000",
    bgHex: "#ffffff",
    borderHex: "#e4e4e7",
    isDark: false,
  },
  {
    id: "mono-charcoal",
    name: "Charcoal Matte",
    badge: "Graphite",
    description: "Minimal dark graphite slate with soft ash contrast and zero glare",
    accentHex: "#e4e4e7",
    bgHex: "#0f0f11",
    borderHex: "#27272a",
    isDark: true,
  },
  {
    id: "mono-alabaster",
    name: "Alabaster Paper",
    badge: "Soft Monochrome",
    description: "Subtle warm paper tone with deep charcoal ink and soft borders",
    accentHex: "#18181b",
    bgHex: "#f5f5f4",
    borderHex: "#e7e5e4",
    isDark: false,
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themeOptions: ThemeOption[];
  currentThemeOption: ThemeOption;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "mono-dark",
  setTheme: () => {},
  themeOptions: THEME_OPTIONS,
  currentThemeOption: THEME_OPTIONS[0],
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>("mono-dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("attendflow_theme") as string;
      if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
        setThemeState(saved as ThemeId);
        applyTheme(saved as ThemeId);
      } else if (saved === "light") {
        setThemeState("mono-light");
        applyTheme("mono-light");
      } else {
        setThemeState("mono-dark");
        applyTheme("mono-dark");
      }
    } catch {
      applyTheme("mono-dark");
    }
    setMounted(true);
  }, []);

  const applyTheme = (t: ThemeId) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", t);
    if (t === "mono-light" || t === "mono-alabaster") {
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
    }
  };

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem("attendflow_theme", newTheme);
    } catch {}
  };

  const currentThemeOption = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themeOptions: THEME_OPTIONS,
        currentThemeOption,
      }}
    >
      <div className={mounted ? "" : "opacity-95"} data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
