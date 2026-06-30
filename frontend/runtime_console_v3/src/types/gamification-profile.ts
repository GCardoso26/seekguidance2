export type XpAction =
  | "marketplace_purchase"
  | "seller_sale"
  | "tournament_registration"
  | "price_alert_triggered"
  | "product_review"
  | "friend_invite";

export type GamificationBadgeRarity = "common" | "rare" | "epic" | "legendary";

export type GamificationBadgeCategory =
  | "buyer"
  | "seller"
  | "tournament"
  | "community"
  | "special";

export type GamificationBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: GamificationBadgeCategory;
  rarity: GamificationBadgeRarity;
  unlock_hint: string;
};

export type UserBadgeUnlock = {
  badge_id: string;
  unlocked_at: string;
};

export type XpEvent = {
  id: string;
  action: XpAction;
  xp_amount: number;
  created_at: string;
  label?: string;
};

export type GamificationProfile = {
  total_xp: number;
  current_level: number;
  xp_for_current_level: number;
  xp_for_next_level: number;
  xp_to_next: number;
  progress_percent: number;
  badges_unlocked: number;
  unlocked_badges: UserBadgeUnlock[];
  recent_events: XpEvent[];
  stats: {
    purchases: number;
    sales: number;
    tournaments: number;
    price_alerts: number;
    reviews: number;
    rulings: number;
    community_answers: number;
  };
};

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  current_level: number;
  badges_count: number;
  city?: string | null;
  game?: string | null;
};

export type GamificationBadgesResponse = {
  badges: Array<GamificationBadge & { unlocked: boolean; unlocked_at: string | null }>;
};
