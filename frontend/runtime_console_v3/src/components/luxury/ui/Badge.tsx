import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function Badge({ children, className, ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-luxury-gold/40 bg-luxury-gold/10 px-3 py-1 text-xs font-medium tracking-wider text-luxury-gold uppercase",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
