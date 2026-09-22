"use client";

import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "orange" | "zinc";

const THEME_STORAGE_KEY = "dsa_sheet_theme_mode";
const LEGACY_THEME_KEY = atob("c3RyaXZlcl9zaGVldF90aGVtZV9tb2Rl");

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("orange");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = (localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_KEY)) as ThemeMode | null;
    if (saved === "zinc" || saved === "orange") {
      setThemeState(saved);
      applyTheme(saved);
    } else {
      // Default to orange as requested
      setThemeState("orange");
      applyTheme("orange");
    }
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    if (mode === "orange") {
      root.classList.add("theme-orange");
      root.classList.remove("theme-zinc");
    } else {
      root.classList.add("theme-zinc");
      root.classList.remove("theme-orange");
    }
  };

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "orange" ? "zinc" : "orange");
  }, [theme, setTheme]);

  return {
    theme,
    isMounted,
    setTheme,
    toggleTheme,
    isOrange: theme === "orange",
  };
}
