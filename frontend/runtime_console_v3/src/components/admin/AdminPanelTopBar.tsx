"use client";

import { usePathname } from "next/navigation";
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
      <span className="shrink-0 text-sm font-semibold lg:hidden">Administração</span>
      <div className="hidden flex-1 lg:block">
        <Breadcrumbs items={breadcrumbs} className="text-luxury-mist" />
      </div>
    </div>
  );
}
