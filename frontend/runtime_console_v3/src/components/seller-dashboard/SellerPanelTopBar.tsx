"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import {
  GlobalSearchDialog,
  GlobalSearchTrigger,
  useGlobalSearchShortcut,
} from "@/components/GlobalSearch";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { sellerPanelBreadcrumbs } from "@/lib/seller-breadcrumbs";
import { HeaderNotificationsDropdown } from "./HeaderNotificationsDropdown";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

type Props = {
  title?: string;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
};

export function SellerPanelTopBar({
  title = "Painel do Vendedor",
  showMenuButton,
  onMenuClick,
}: Props) {
  const pathname = usePathname() ?? "";
  const breadcrumbs = sellerPanelBreadcrumbs(pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  useGlobalSearchShortcut(openSearch);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 text-sm lg:hidden"
            aria-label="Abrir menu"
          >
            ☰
          </button>
        )}
        <span className="shrink-0 text-sm font-semibold lg:hidden">{title}</span>
        <div className="hidden flex-1 flex-col gap-1 lg:flex">
          <Breadcrumbs items={breadcrumbs} className="text-luxury-mist" />
          <GlobalSearchTrigger onOpen={openSearch} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={openSearch}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/5 lg:hidden"
            aria-label="Buscar"
          >
            🔍
          </button>
          <HeaderNotificationsDropdown />
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 sm:flex"
            aria-label="Atalhos de teclado"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
