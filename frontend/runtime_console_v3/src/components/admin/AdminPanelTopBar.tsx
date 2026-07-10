"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { adminPanelBreadcrumbs } from "@/lib/admin-breadcrumbs";

type Props = {
  showMenuButton?: boolean;
  onMenuClick?: () => void;
};

export function AdminPanelTopBar({ showMenuButton, onMenuClick }: Props) {
  const pathname = usePathname() ?? "";
  const breadcrumbs = adminPanelBreadcrumbs(pathname);

  return (
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
      <span className="shrink-0 text-small font-semibold lg:hidden">Administração</span>
      <div className="hidden flex-1 lg:block">
        <Breadcrumbs items={breadcrumbs} className="text-muted-foreground" />
      </div>
    </div>
  );
}
