"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showXpNotification } from "@/components/gamification/XpNotification";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  GAMIFICATION_BADGES_KEY,
  GAMIFICATION_LEADERBOARD_KEY,
  GAMIFICATION_QUERY_KEY,
} from "@/lib/gamification";
import type {
  GamificationBadgesResponse,
  GamificationProfile,
  LeaderboardRow,
  XpAction,
} from "@/types/gamification-profile";

const STALE_TIME = 5 * 60 * 1000;

async function fetchProfile(): Promise<GamificationProfile> {
  const res = await fetch("/api/gamification/profile");
  if (!res.ok) throw new Error("gamification_profile_failed");
  return res.json();
}

async function fetchBadges(): Promise<GamificationBadgesResponse> {
  const res = await fetch("/api/gamification/badges");
  if (!res.ok) throw new Error("gamification_badges_failed");
  return res.json();
}

async function fetchLeaderboard(params?: {
  city?: string;
  game?: string;
  limit?: number;
}): Promise<{ entries: LeaderboardRow[]; my_rank: number | null }> {
  const qs = new URLSearchParams({ limit: String(params?.limit ?? 100) });
  if (params?.city) qs.set("city", params.city);
  if (params?.game) qs.set("game", params.game);
  const res = await fetch(`/api/gamification/leaderboard?${qs}`);
  if (!res.ok) throw new Error("gamification_leaderboard_failed");
  return res.json();
}

export function useGamificationProfile() {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: GAMIFICATION_QUERY_KEY,
    queryFn: fetchProfile,
    enabled: Boolean(user),
    staleTime: STALE_TIME,
  });
}

export function useGamificationBadges() {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: GAMIFICATION_BADGES_KEY,
    queryFn: fetchBadges,
    enabled: Boolean(user),
    staleTime: STALE_TIME,
  });
}

export function useGamificationLeaderboard(params?: {
  city?: string;
  game?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...GAMIFICATION_LEADERBOARD_KEY, params?.city ?? "", params?.game ?? "", params?.limit ?? 100],
    queryFn: () => fetchLeaderboard(params),
    staleTime: STALE_TIME,
  });
}

export function useAwardXp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: XpAction) => {
      const res = await fetch("/api/gamification/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("xp_award_failed");
      return res.json() as Promise<{
        profile: GamificationProfile;
        event: { action: XpAction; xp_amount: number };
        new_badges: string[];
      }>;
    },
    onSuccess: (data) => {
      showXpNotification({
        action: data.event.action,
        xpAmount: data.event.xp_amount,
        progressPercent: data.profile.progress_percent,
        newBadges: data.new_badges,
      });
      void qc.invalidateQueries({ queryKey: GAMIFICATION_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: GAMIFICATION_BADGES_KEY });
      void qc.invalidateQueries({ queryKey: GAMIFICATION_LEADERBOARD_KEY });
    },
  });
}
