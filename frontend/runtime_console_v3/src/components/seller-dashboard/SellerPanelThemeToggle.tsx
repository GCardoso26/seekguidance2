"use client";

import { Moon, Sun } from "lucide-react";
import { useSellerPanelTheme } from "@/contexts/SellerPanelThemeContext";

export function SellerPanelThemeToggle() {
  const { theme, toggle } = useSellerPanelTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex min-h-[36px] min-w-[36px] items-center justify-center surface-card rounded-lg text-muted-foreground hover:bg-muted"
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      title={theme === "dark" ? "Luxury Light" : "Dark Premium"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
