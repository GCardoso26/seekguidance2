"use client";

import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import CountUp from "@/components/react-bits/CountUp";
import FadeContent from "@/components/react-bits/FadeContent";
import BlurText from "@/components/react-bits/BlurText";

/** Número com CountUp; estático se reduced-motion. */
export function GalleryCountUp({
  to,
  className,
  duration = 1.2,
  separator = ".",
}: {
  to: number;
  className?: string;
  duration?: number;
  separator?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce || !Number.isFinite(to)) {
    return <span className={className}>{Math.round(to).toLocaleString("pt-BR")}</span>;
  }
  return <CountUp to={to} duration={duration} separator={separator} className={className} />;
}

/** Fade de entrada para blocos (listas/KPIs/empty). Sem efeito se reduced-motion. */
export function GalleryFade({
  children,
  className,
  duration = 0.55,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <FadeContent className={className} duration={duration} delay={delay} threshold={0.08}>
      {children}
    </FadeContent>
  );
}

/** Título visual com BlurText + heading acessível. */
export function GalleryHeading({
  text,
  as = "h1",
  className,
}: {
  text: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const Tag = as;
  return (
    <>
      <Tag className="sr-only">{text}</Tag>
      {reduce ? (
        <p className={className} aria-hidden>
          {text}
        </p>
      ) : (
        <BlurText text={text} delay={40} animateBy="words" className={className} />
      )}
    </>
  );
}
