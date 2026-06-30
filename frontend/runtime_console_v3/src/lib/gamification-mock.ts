import {
  computeUnlockedBadgeIds,
  type BadgeUnlockStats,
} from "@/lib/badges";
import {
  levelFromTotalXp,
  totalXpForLevel,
  XP_REWARDS,
  xpProgress,
} from "@/lib/gamification";
import type { GamificationProfile, LeaderboardRow, XpAction, XpEvent } from "@/types/gamification-profile";

type UserState = {
  total_xp: number;
  stats: BadgeUnlockStats;
  events: XpEvent[];
  unlocked_at: Record<string, string>;
  display_name: string;
  avatar_url: string | null;
  city?: string;
};

const users = new Map<string, UserState>();

const MOCK_LEADERBOARD: LeaderboardRow[] = [
  { rank: 1, user_id: "u1", display_name: "TCG_Master", avatar_url: null, total_xp: 84200, current_level: 48, badges_count: 9, city: "São Paulo" },
  { rank: 2, user_id: "u2", display_name: "CardShark", avatar_url: null, total_xp: 71500, current_level: 46, badges_count: 8, city: "Rio de Janeiro" },
  { rank: 3, user_id: "u3", display_name: "JudgeBR", avatar_url: null, total_xp: 62000, current_level: 44, badges_count: 11, city: "Curitiba" },
  { rank: 4, user_id: "u4", display_name: "PokeFan", avatar_url: null, total_xp: 45000, current_level: 40, badges_count: 6, city: "Belo Horizonte" },
  { rank: 5, user_id: "u5", display_name: "LojaTop", avatar_url: null, total_xp: 38000, current_level: 38, badges_count: 7, city: "Porto Alegre" },
];

function defaultState(userId: string, displayName?: string): UserState {
  return {
    total_xp: 850,
    stats: {
      purchases: 1,
      sales: 0,
      tournaments: 0,
      price_alerts: 0,
      reviews: 0,
      rulings: 0,
      community_answers: 0,
      tournament_wins: 0,
      fast_shipping_rate: 0,
      account_created_at: "2025-06-01T00:00:00.000Z",
      feedback_sent: false,
    },
    events: [],
    unlocked_at: {},
    display_name: displayName ?? "Jogador",
    avatar_url: null,
    city: "São Paulo",
  };
}

function bucket(userId: string): UserState {
  let state = users.get(userId);
  if (!state) {
    state = defaultState(userId);
    users.set(userId, state);
  }
  return state;
}

function syncBadges(state: UserState): void {
  const ids = computeUnlockedBadgeIds(state.stats);
  const now = new Date().toISOString();
  for (const id of ids) {
    if (!state.unlocked_at[id]) state.unlocked_at[id] = now;
  }
}

export function mockGamificationProfile(userId: string, displayName?: string): GamificationProfile {
  const state = bucket(userId);
  if (displayName) state.display_name = displayName;
  syncBadges(state);
  const progress = xpProgress(state.total_xp);
  const unlocked = Object.entries(state.unlocked_at).map(([badge_id, unlocked_at]) => ({
    badge_id,
    unlocked_at,
  }));

  return {
    total_xp: state.total_xp,
    ...progress,
    badges_unlocked: unlocked.length,
    unlocked_badges: unlocked,
    recent_events: state.events.slice(0, 20),
    stats: {
      purchases: state.stats.purchases,
      sales: state.stats.sales,
      tournaments: state.stats.tournaments,
      price_alerts: state.stats.price_alerts,
      reviews: state.stats.reviews,
      rulings: state.stats.rulings,
      community_answers: state.stats.community_answers,
    },
  };
}

export function mockAwardXp(
  userId: string,
  action: XpAction,
): { profile: GamificationProfile; event: XpEvent; new_badges: string[] } {
  const state = bucket(userId);
  const before = new Set(computeUnlockedBadgeIds(state.stats));
  const xp_amount = XP_REWARDS[action];

  switch (action) {
    case "marketplace_purchase":
      state.stats.purchases += 1;
      break;
    case "seller_sale":
      state.stats.sales += 1;
      break;
    case "tournament_registration":
      state.stats.tournaments += 1;
      break;
    case "price_alert_triggered":
      state.stats.price_alerts += 1;
      break;
    case "product_review":
      state.stats.reviews += 1;
      break;
    case "friend_invite":
      break;
  }

  state.total_xp += xp_amount;
  const event: XpEvent = {
    id: `xp-${userId}-${Date.now()}`,
    action,
    xp_amount,
    created_at: new Date().toISOString(),
  };
  state.events.unshift(event);
  syncBadges(state);
  const after = computeUnlockedBadgeIds(state.stats);
  const new_badges = after.filter((id) => !before.has(id));

  return { profile: mockGamificationProfile(userId), event, new_badges };
}

export function mockLeaderboard(
  userId?: string,
  filter?: { game?: string; city?: string },
): { entries: LeaderboardRow[]; my_rank: number | null } {
  let entries = [...MOCK_LEADERBOARD];
  if (filter?.city) {
    entries = entries.filter((e) => e.city === filter.city);
  }
  const state = userId ? bucket(userId) : null;
  if (state && userId) {
    const level = levelFromTotalXp(state.total_xp);
    const me: LeaderboardRow = {
      rank: 0,
      user_id: userId,
      display_name: state.display_name,
      avatar_url: state.avatar_url,
      total_xp: state.total_xp,
      current_level: level,
      badges_count: Object.keys(state.unlocked_at).length,
      city: state.city,
    };
    entries = [...entries, me].sort((a, b) => b.total_xp - a.total_xp);
    entries = entries.map((e, i) => ({ ...e, rank: i + 1 }));
    const my_rank = entries.find((e) => e.user_id === userId)?.rank ?? null;
    return { entries: entries.slice(0, 100), my_rank };
  }
  return { entries: entries.slice(0, 100), my_rank: null };
}

export function mockBadgeUnlockStats(userId: string): BadgeUnlockStats {
  return bucket(userId).stats;
}

export function mockUnlockedAt(userId: string): Record<string, string> {
  return bucket(userId).unlocked_at;
}

/** Utilitário de teste: nível mínimo por XP. */
export { totalXpForLevel, levelFromTotalXp };
