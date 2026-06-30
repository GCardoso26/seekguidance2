"use client";

import { toast } from "sonner";
import { XP_ACTION_LABELS } from "@/lib/gamification";
import type { XpAction } from "@/types/gamification-profile";

type XpToastOptions = {
  action: XpAction;
  xpAmount: number;
  progressPercent?: number;
  newBadges?: string[];
};

export function showXpNotification({
  action,
  xpAmount,
  progressPercent,
  newBadges,
}: XpToastOptions): void {
  const label = XP_ACTION_LABELS[action] ?? action;
  const badgeNote =
    newBadges && newBadges.length > 0
      ? ` · ${newBadges.length} badge${newBadges.length > 1 ? "s" : ""} desbloqueado${newBadges.length > 1 ? "s" : ""}!`
      : "";

  toast.success(`Você ganhou ${xpAmount} XP pela sua ${label}!${badgeNote}`, {
    icon: "⭐",
    duration: 4000,
    className: "animate-slide-in-right",
    description:
      progressPercent !== undefined
        ? `Progresso do nível: ${progressPercent}%`
        : undefined,
  });
}
