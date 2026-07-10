/**
 * Motion Design System (RC2)
 * Linear/Stripe-inspired — 150–250ms, reduced-motion aware.
 * UI-only — sem lógica de negócio.
 */

import type { Transition, Variants } from "framer-motion";

export const motionDuration = {
  fast: 0.15,
  base: 0.2,
  slow: 0.25,
} as const;

export const motionEase = [0.16, 1, 0.3, 1] as const;

export const transitionBase: Transition = {
  duration: motionDuration.base,
  ease: motionEase,
};

export const transitionFast: Transition = {
  duration: motionDuration.fast,
  ease: motionEase,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitionBase },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: transitionBase },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: transitionFast },
};

export const collapse: Variants = {
  open: { height: "auto", opacity: 1, transition: transitionBase },
  closed: { height: 0, opacity: 0, transition: transitionFast },
};

export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: motionDuration.fast } },
  exit: { opacity: 0, transition: { duration: motionDuration.fast } },
};

export const drawerSlide = (side: "left" | "right" = "right"): Variants => ({
  hidden: { x: side === "right" ? "100%" : "-100%" },
  visible: { x: 0, transition: transitionBase },
  exit: { x: side === "right" ? "100%" : "-100%", transition: transitionFast },
});

/** Prefer CSS for hover/press when possible — use these for Framer only. */
export const interactiveHover = {
  y: -1,
  transition: transitionFast,
};

export const interactiveTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Disable animation when user prefers reduced motion. */
export function motionSafe<T extends Transition>(t: T): T | { duration: 0 } {
  return prefersReducedMotion() ? { duration: 0 } : t;
}
