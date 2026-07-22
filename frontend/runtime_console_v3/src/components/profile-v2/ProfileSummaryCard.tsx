"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  icon?: LucideIcon;
  className?: string;
  tone?: "default" | "up" | "down";
};

export function ProfileSummaryCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  className,
  tone = "default",
}: Props) {
  const body = (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card/40 p-4 transition",
        href && "hover:border-primary/35 hover:bg-card/70",
        className,
      )}
      data-testid="profile-summary-card"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-caption text-muted-foreground">{label}</p>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" aria-hidden /> : null}
      </div>
      <p
        className={cn(
          "mt-2 text-h3 font-semibold tracking-tight",
          tone === "up" && "text-success",
          tone === "down" && "text-danger",
          tone === "default" && "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-caption text-muted-foreground">{hint}</p> : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}
