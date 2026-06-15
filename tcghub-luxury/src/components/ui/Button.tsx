import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
};

const styles = {
  primary:
    "bg-luxury-gold text-luxury-onyx hover:bg-luxury-gold-light shadow-lg shadow-luxury-gold/10",
  secondary:
    "border border-luxury-silver/30 bg-white/5 text-luxury-frost hover:border-luxury-gold/50",
  ghost: "text-luxury-mist hover:text-luxury-frost",
};

export function Button({ children, className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-wide transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/60",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
