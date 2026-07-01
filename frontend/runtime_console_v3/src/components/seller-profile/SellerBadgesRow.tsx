"use client";

import {
  BadgeCheck,
  Crown,
  MessageCircle,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import type { SellerBadge } from "@/lib/seller-analytics-query";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: Truck,
  crown: Crown,
  "message-circle": MessageCircle,
  "badge-check": BadgeCheck,
  sparkles: Sparkles,
  zap: Zap,
};

type Props = {
  badges: SellerBadge[];
};

export function SellerBadgesRow({ badges }: Props) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => {
        const Icon = ICONS[badge.icon] ?? Sparkles;
        return (
          <span
            key={badge.id}
            title={badge.description}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Icon className="h-3.5 w-3.5" />
            {badge.name}
          </span>
        );
      })}
    </div>
  );
}
