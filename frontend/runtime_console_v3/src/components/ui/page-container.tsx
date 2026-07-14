/**
 * PageContainer — Design System v3 (conteúdo público marketplace)
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageContainerProps = {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

export function PageContainer({ children, className, narrow }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 lg:px-8",
        narrow ? "max-w-3xl" : "max-w-7xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
