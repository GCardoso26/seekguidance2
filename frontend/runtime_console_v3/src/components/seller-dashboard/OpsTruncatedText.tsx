"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** Optional rich content when collapsed (e.g. highlighted title). Defaults to text. */
  children?: ReactNode;
  className?: string;
  /** Secondary line under the primary truncated text. */
  subtitle?: string;
  /** When set, primary text is a Link (no nested button). */
  href?: string;
};

/**
 * Operational truncation with click-to-reveal (P2 OpenDesign).
 * Hover: native title. Click “Mais/Menos”: expand in place (no nested interactive).
 */
export function OpsTruncatedText({ text, children, className, subtitle, href }: Props) {
  const [expanded, setExpanded] = useState(false);
  const content = children ?? text;
  const longEnough = text.trim().length > 28 || (subtitle?.trim().length ?? 0) > 28;

  const primaryClass = cn(
    "font-medium text-foreground",
    expanded ? "whitespace-normal break-words" : "block truncate",
  );

  return (
    <div className={cn("min-w-0 max-w-[16rem] sm:max-w-[20rem]", className)} data-testid="ops-truncated">
      {href ? (
        <Link
          href={href}
          className={cn(primaryClass, "hover:text-primary hover:underline")}
          title={expanded ? undefined : text}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </Link>
      ) : (
        <p className={primaryClass} title={expanded ? undefined : text}>
          {content}
        </p>
      )}
      {subtitle ? (
        <p
          className={cn(
            "mt-0.5 text-caption text-muted-foreground",
            expanded ? "whitespace-normal break-words" : "truncate",
          )}
          title={expanded ? undefined : subtitle}
        >
          {subtitle}
        </p>
      ) : null}
      {longEnough ? (
        <button
          type="button"
          className="mt-0.5 text-caption font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={expanded}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? "Menos" : "Mais"}
        </button>
      ) : null}
    </div>
  );
}
