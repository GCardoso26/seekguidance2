"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GlobalCommandPalette } from "@/components/search/GlobalCommandPalette";
import { isFeatureEnabled } from "@/lib/feature-flags";

type SearchPlatformContextValue = {
  open: boolean;
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
};

const SearchPlatformContext = createContext<SearchPlatformContextValue | null>(null);

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

export function SearchPlatformProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const enabled = isFeatureEnabled("GLOBAL_SEARCH");

  const openPalette = useCallback(() => {
    if (enabled) setOpen(true);
  }, [enabled]);

  const closePalette = useCallback(() => setOpen(false), []);

  const togglePalette = useCallback(() => {
    if (!enabled) return;
    setOpen((v) => !v);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        togglePalette();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, togglePalette]);

  const value = useMemo(
    () => ({ open, openPalette, closePalette, togglePalette }),
    [open, openPalette, closePalette, togglePalette],
  );

  return (
    <SearchPlatformContext.Provider value={value}>
      {children}
      {enabled && <GlobalCommandPalette open={open} onOpenChange={setOpen} />}
    </SearchPlatformContext.Provider>
  );
}

export function useSearchPlatform() {
  const ctx = useContext(SearchPlatformContext);
  if (!ctx) {
    return {
      open: false,
      openPalette: () => {},
      closePalette: () => {},
      togglePalette: () => {},
    };
  }
  return ctx;
}
