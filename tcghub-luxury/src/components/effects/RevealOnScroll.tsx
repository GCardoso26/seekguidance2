import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, scaleIn, slideLeft, slideRight } from "@/constants/motion";
import type { MotionVariant } from "@/types";
import { cn } from "@/lib/utils";

const variants = { fadeUp, scaleIn, slideLeft, slideRight };

type Props = {
  children: ReactNode;
  variant?: MotionVariant;
  className?: string;
  delay?: number;
};

export function RevealOnScroll({
  children,
  variant = "fadeUp",
  className,
  delay = 0,
}: Props) {
  const v = variants[variant];
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={v}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
