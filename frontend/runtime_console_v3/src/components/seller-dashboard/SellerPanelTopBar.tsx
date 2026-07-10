"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, Menu, Search } from "lucide-react";
import { GlobalSearchTrigger } from "@/components/GlobalSearch";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { sellerPanelBreadcrumbs } from "@/lib/seller-breadcrumbs";
import { useSellerPanelShortcuts } from "@/hooks/useSellerPanelShortcuts";
import { useSearchPlatform } from "@/features/search/SearchPlatformContext";
import { HeaderNotificationsDropdown } from "./HeaderNotificationsDropdown";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { SellerPanelThemeToggle } from "./SellerPanelThemeToggle";

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
  const { openPalette } = useSearchPlatform();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const openSearch = useCallback(() => openPalette(), [openPalette]);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);

  useSellerPanelShortcuts({ onOpenShortcuts: openShortcuts });

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground transition-colors hover:bg-muted/80 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-4 w-4" aria-hidden />
          </button>
        )}
        <span className="shrink-0 text-small font-semibold lg:hidden">{title}</span>
        <div className="hidden flex-1 flex-col gap-1 lg:flex">
          <Breadcrumbs items={breadcrumbs} className="text-muted-foreground" />
          <GlobalSearchTrigger />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SellerPanelThemeToggle />
          <button
            type="button"
            onClick={openSearch}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted lg:hidden"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
          <HeaderNotificationsDropdown />
          <button
            type="button"
            onClick={openShortcuts}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted sm:flex"
            aria-label="Atalhos de teclado"
          >
            <HelpCircle className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}
