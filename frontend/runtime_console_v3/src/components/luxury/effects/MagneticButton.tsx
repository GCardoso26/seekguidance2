"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

const variantStyles = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-luxury-gold/10",
  secondary:
    "border border-luxury-silver/30 bg-muted/50 text-foreground hover:border-luxury-gold/50 hover:bg-muted",
  ghost: "text-muted-foreground hover:text-foreground",
};

export function MagneticButton({
  children,
  className,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const onMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);
    x.set(Math.max(-8, Math.min(8, offsetX * 0.15)));
    y.set(Math.max(-8, Math.min(8, offsetY * 0.15)));
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium tracking-wide transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-luxury-onyx",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
