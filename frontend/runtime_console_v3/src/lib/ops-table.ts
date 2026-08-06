import { cn } from "@/lib/utils";

/** Priority for responsive column hide/show in seller ops tables (P2 OpenDesign). */
export type OpsColumnPriority = "primary" | "secondary" | "tertiary";

export type OpsColumnMeta = {
  priority?: OpsColumnPriority;
  /** Tailwind min-width utility, e.g. min-w-[12rem] */
  minWidthClass?: string;
};

/** Hide secondary/tertiary columns on narrow viewports; keep primary. */
export function opsColumnVisibilityClass(priority: OpsColumnPriority = "primary"): string {
  switch (priority) {
    case "tertiary":
      return "hidden lg:table-cell";
    case "secondary":
      return "hidden md:table-cell";
    case "primary":
    default:
      return "";
  }
}

export function opsColumnCellClass(meta?: OpsColumnMeta): string {
  return cn(opsColumnVisibilityClass(meta?.priority ?? "primary"), meta?.minWidthClass);
}
