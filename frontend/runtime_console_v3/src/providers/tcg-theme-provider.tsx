"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { applyTcgThemeVars, getTcgTheme } from "@/styles/tcg-theme";
import type { TcgType } from "@/types/judge";

const TcgThemeCtx = createContext<TcgType>("magic");

export function TcgThemeProvider({ tcg, children }: { tcg: TcgType; children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    applyTcgThemeVars(root, tcg);
    root.classList.add("judge-tcg-active");
    return () => {
      root.classList.remove("judge-tcg-active");
    };
  }, [tcg]);

  return <TcgThemeCtx.Provider value={tcg}>{children}</TcgThemeCtx.Provider>;
}

export function useTcgThemeId(): TcgType {
  return useContext(TcgThemeCtx);
}

export function useTcgTheme() {
  const id = useTcgThemeId();
  return getTcgTheme(id);
}
