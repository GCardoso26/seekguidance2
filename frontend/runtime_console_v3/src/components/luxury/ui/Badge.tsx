import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function Badge({ children, className, ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium tracking-wider text-primary uppercase",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
