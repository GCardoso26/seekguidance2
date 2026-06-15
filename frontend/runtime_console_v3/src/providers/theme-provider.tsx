"use client";
import { createContext, useContext } from "react";

const ThemeCtx = createContext<{ theme: "dark" }>({ theme: "dark" });

/** Tema fixo escuro — alinhado com `<html className="dark">`. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeCtx.Provider value={{ theme: "dark" }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
