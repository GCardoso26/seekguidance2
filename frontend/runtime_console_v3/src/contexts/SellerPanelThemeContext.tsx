"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type SellerPanelTheme = "dark" | "light";

type Ctx = {
  theme: SellerPanelTheme;
  setTheme: (t: SellerPanelTheme) => void;
  toggle: () => void;
};

const SellerPanelThemeContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "judgetcg-seller-panel-theme";

export function SellerPanelThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<SellerPanelTheme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as SellerPanelTheme | null;
    if (stored === "light" || stored === "dark") setThemeState(stored);
  }, []);

  const setTheme = useCallback((t: SellerPanelTheme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);

  return <SellerPanelThemeContext.Provider value={value}>{children}</SellerPanelThemeContext.Provider>;
}

export function useSellerPanelTheme() {
  const ctx = useContext(SellerPanelThemeContext);
  if (!ctx) {
    return {
      theme: "dark" as const,
      setTheme: () => undefined,
      toggle: () => undefined,
    };
  }
  return ctx;
}
