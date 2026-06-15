import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: number;
  color?: string;
};

export function GlowOrb({ className, size = 320, color = "rgba(212, 175, 55, 0.2)" }: Props) {
  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
      animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
