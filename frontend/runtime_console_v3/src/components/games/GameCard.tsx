"use client";

import Image from "next/image";
import Link from "next/link";
import { gameLandingPath } from "@/lib/game-routes";
import { cn } from "@/lib/utils";

interface GameCardProps {
  slug: string;
  name: string;
  description?: string;
  logoUrl: string;
  cardCount: number;
  primaryColor: string;
  isAvailable?: boolean;
  className?: string;
}

export function GameCard({
  slug,
  name,
  description,
  logoUrl,
  cardCount,
  primaryColor,
  isAvailable = true,
  className,
}: GameCardProps) {
  return (
    <Link
      href={gameLandingPath(slug)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5",
        !isAvailable && "opacity-60",
        className,
      )}
      style={{ borderColor: `${primaryColor}30` }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${primaryColor}08, transparent)` }}
      />
      <div className="relative flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl p-2"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <Image src={logoUrl} alt="" width={48} height={48} className="h-10 w-10 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-tight" style={{ color: primaryColor }}>
            {name}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="relative mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {cardCount > 0 ? `${cardCount.toLocaleString("pt-BR")} cartas` : "Em sincronização"}
        </span>
        <span className="font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Explorar →
        </span>
      </div>
    </Link>
  );
}
