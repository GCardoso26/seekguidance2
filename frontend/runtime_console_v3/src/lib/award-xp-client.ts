"use client";

import type { QueryClient } from "@tanstack/react-query";
import { showXpNotification } from "@/components/gamification/XpNotification";
import {
  GAMIFICATION_BADGES_KEY,
  GAMIFICATION_LEADERBOARD_KEY,
  GAMIFICATION_QUERY_KEY,
} from "@/lib/gamification";
import type { XpAction } from "@/types/gamification-profile";

type AwardXpResult = {
  profile: { progress_percent: number };
  event: { action: XpAction; xp_amount: number };
  new_badges: string[];
};

/**
 * Concede XP sem bloquear o fluxo principal. Falhas são silenciosas.
 */
export function awardXpFireAndForget(action: XpAction, qc?: QueryClient): void {
  void (async () => {
    try {
      const res = await fetch("/api/gamification/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as AwardXpResult;
      showXpNotification({
        action: data.event.action,
        xpAmount: data.event.xp_amount,
        progressPercent: data.profile.progress_percent,
        newBadges: data.new_badges,
      });
      if (qc) {
        void qc.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEY });
        void qc.invalidateQueries({ queryKey: GAMIFICATION_BADGES_KEY });
        void qc.invalidateQueries({ queryKey: GAMIFICATION_LEADERBOARD_KEY });
      }
    } catch {
      // fallback silencioso
    }
  })();
}
