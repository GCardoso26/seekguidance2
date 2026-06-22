import { createClient } from "@supabase/supabase-js";

export type BadgeRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  condition_type: string;
  condition_value: number;
};

export type UserBadgeRow = {
  badge_id: string;
  earned_at: string;
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { db: { schema: "tcg_judge" } });
}

export async function fetchAllBadges(): Promise<BadgeRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase.from("badges").select("*").order("condition_value");
  return (data ?? []) as BadgeRow[];
}

export async function fetchUserBadges(userId: string): Promise<UserBadgeRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", userId);
  return (data ?? []) as UserBadgeRow[];
}

async function countRulings(userId: string): Promise<number> {
  const supabase = getServiceClient();
  if (!supabase) return 0;
  const { data: sessions } = await supabase.from("judge_sessions").select("id").eq("auth_user_id", userId);
  if (!sessions?.length) return 0;
  const ids = sessions.map((s) => s.id);
  const { count } = await supabase
    .from("judge_session_messages")
    .select("id", { count: "exact", head: true })
    .eq("role", "user")
    .in("session_id", ids);
  return count ?? 0;
}

async function computeStreak(userId: string): Promise<number> {
  const supabase = getServiceClient();
  if (!supabase) return 0;

  const { data: sessions } = await supabase.from("judge_sessions").select("id").eq("auth_user_id", userId);
  if (!sessions?.length) return 0;
  const ids = sessions.map((s) => s.id);

  const { data: rows } = await supabase
    .from("judge_session_messages")
    .select("created_at")
    .eq("role", "user")
    .in("session_id", ids)
    .order("created_at", { ascending: false })
    .limit(500);

  const days = new Set((rows ?? []).map((r) => String(r.created_at).slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

async function countComments(userId: string): Promise<number> {
  const supabase = getServiceClient();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("post_comments")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);
  return count ?? 0;
}

async function countFollowers(userId: string): Promise<number> {
  const supabase = getServiceClient();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("following_id", userId);
  return count ?? 0;
}

async function getMetric(userId: string, conditionType: string): Promise<number> {
  switch (conditionType) {
    case "rulings_count":
      return countRulings(userId);
    case "streak":
      return computeStreak(userId);
    case "comments_count":
      return countComments(userId);
    case "followers_count":
      return countFollowers(userId);
    default:
      return 0;
  }
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const badges = await fetchAllBadges();
  const earned = await fetchUserBadges(userId);
  const earnedSet = new Set(earned.map((b) => b.badge_id));
  const newlyEarned: string[] = [];

  for (const badge of badges) {
    if (earnedSet.has(badge.id)) continue;
    if (badge.condition_type === "tournament_rank") continue;

    const metric = await getMetric(userId, badge.condition_type);
    if (metric >= badge.condition_value) {
      const { error } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });
      if (!error) {
        newlyEarned.push(badge.id);
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "badge_earned",
          title: `Badge desbloqueado: ${badge.name}`,
          content: badge.description,
          link: "/perfil",
        });
      }
    }
  }

  return newlyEarned;
}

export async function getBadgesWithProgress(userId: string) {
  const badges = await fetchAllBadges();
  const earned = await fetchUserBadges(userId);
  const earnedMap = new Map(earned.map((b) => [b.badge_id, b.earned_at]));

  const metricsCache = new Map<string, number>();

  return Promise.all(
    badges.map(async (badge) => {
      let current = 0;
      if (badge.condition_type !== "tournament_rank") {
        if (!metricsCache.has(badge.condition_type)) {
          metricsCache.set(badge.condition_type, await getMetric(userId, badge.condition_type));
        }
        current = metricsCache.get(badge.condition_type) ?? 0;
      }
      return {
        ...badge,
        earned: earnedMap.has(badge.id),
        earnedAt: earnedMap.get(badge.id) ?? null,
        progress: Math.min(current, badge.condition_value),
        current,
      };
    }),
  );
}
