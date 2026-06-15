import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hover?: boolean;
};

export function Card({ children, className, hover = false, ...props }: Props) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-6",
        hover &&
          "transition-all duration-500 hover:-translate-y-1 hover:border-luxury-gold/20 hover:shadow-xl hover:shadow-luxury-gold/5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
