"use client";



import { useSearchPlatform } from "@/features/search/SearchPlatformContext";

import { isFeatureEnabled } from "@/lib/feature-flags";

import { Search } from "lucide-react";



type GlobalSearchTriggerProps = {

  onOpen?: () => void;

  className?: string;

};



/** Abre o Command Palette universal (Ctrl+K). */

export function GlobalSearchTrigger({ onOpen, className }: GlobalSearchTriggerProps) {

  const { openPalette } = useSearchPlatform();



  if (!isFeatureEnabled("GLOBAL_SEARCH")) return null;



  return (

    <button

      type="button"

      onClick={() => {

        openPalette();

        onOpen?.();

      }}

      className={

        className ??

        "flex min-h-[44px] flex-1 items-center gap-2 surface-card rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted lg:max-w-md"

      }

      aria-label="Abrir busca global (Ctrl+K)"

      data-testid="seller-global-search-trigger"

    >

      <Search className="h-4 w-4 shrink-0" aria-hidden />

      <span className="flex-1 text-left">Pesquisar…</span>

      <kbd className="hidden rounded border border-border px-1.5 text-caption sm:inline">⌘K</kbd>

    </button>

  );

}



/** @deprecated Dialog legado — palette unificado via SearchPlatformProvider */

export function GlobalSearchDialog({

  open: _open,

  onOpenChange: _onOpenChange,

}: {

  open: boolean;

  onOpenChange: (open: boolean) => void;

}) {

  return null;

}



/** @deprecated Ctrl+K centralizado em SearchPlatformProvider */

export function useGlobalSearchShortcut(_onOpen: () => void) {

  // noop — atalho global no SearchPlatformProvider

}


