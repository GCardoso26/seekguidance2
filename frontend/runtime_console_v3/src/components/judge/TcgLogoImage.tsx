"use client";

import { TCGLogo, type TCGLogoProps } from "@/components/judge/TCGLogo";
import type { TcgType } from "@/types/judge";

type Props = {
  tcgId: TcgType;
  variant?: "default" | "compact";
  selected?: boolean;
  priority?: boolean;
  className?: string;
  monochrome?: boolean;
};

/** @deprecated Preferir TCGLogo — mantido para compatibilidade com TcgSelector. */
export function TcgLogoImage({ tcgId, variant = "default", selected, priority, className, monochrome }: Props) {
  const props: TCGLogoProps = {
    tcgId,
    variant,
    selected,
    priority,
    className,
    monochrome,
  };
  return <TCGLogo {...props} />;
}
