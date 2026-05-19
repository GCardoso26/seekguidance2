"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext<{ theme: "dark" | "light"; toggle: () => void }>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => { document.documentElement.classList.toggle("light", theme === "light"); }, [theme]);
  return <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);
