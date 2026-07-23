export const FEATURES = {
  SELLER_ANALYTICS: process.env.NEXT_PUBLIC_FEATURE_SELLER_ANALYTICS !== "false",
  SYNTAX_SEARCH: process.env.NEXT_PUBLIC_FEATURE_SYNTAX_SEARCH !== "false",
  REVIEWS: process.env.NEXT_PUBLIC_FEATURE_REVIEWS !== "false",
  GLOBAL_SEARCH: process.env.NEXT_PUBLIC_FEATURE_GLOBAL_SEARCH !== "false",
  HEADER_NOTIFICATIONS: process.env.NEXT_PUBLIC_FEATURE_HEADER_NOTIFICATIONS !== "false",
  TICKETS: process.env.NEXT_PUBLIC_FEATURE_TICKETS !== "false",
  TEAM_RBAC: process.env.NEXT_PUBLIC_FEATURE_TEAM_RBAC !== "false",
  FINANCE_DASHBOARD: process.env.NEXT_PUBLIC_FEATURE_FINANCE_DASHBOARD !== "false",
  WISHLIST_V2: process.env.NEXT_PUBLIC_FEATURE_WISHLIST_V2 !== "false",
  SHIPPING_V2: process.env.NEXT_PUBLIC_FEATURE_SHIPPING_V2 !== "false",
  COLLECTION_V2: process.env.NEXT_PUBLIC_FEATURE_COLLECTION_V2 !== "false",
  COLLECTION_ALERTS: process.env.NEXT_PUBLIC_FEATURE_COLLECTION_ALERTS !== "false",
  DECK_V2: process.env.NEXT_PUBLIC_FEATURE_DECK_V2 !== "false",
  PLAYER_PROFILE_V2: process.env.NEXT_PUBLIC_FEATURE_PLAYER_PROFILE_V2 !== "false",
  PLAYER_PUBLIC_PROFILE: process.env.NEXT_PUBLIC_FEATURE_PLAYER_PUBLIC_PROFILE !== "false",
  PLAYER_ACHIEVEMENTS: process.env.NEXT_PUBLIC_FEATURE_PLAYER_ACHIEVEMENTS !== "false",
  PLAYER_ACTIVITY: process.env.NEXT_PUBLIC_FEATURE_PLAYER_ACTIVITY !== "false",
  PLAYER_BADGES: process.env.NEXT_PUBLIC_FEATURE_PLAYER_BADGES !== "false",
  /** Epics 11–20 */
  INTELLIGENCE_PLATFORM: process.env.NEXT_PUBLIC_FEATURE_INTELLIGENCE_PLATFORM !== "false",
  NOTIFICATION_CENTER_V2: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATION_CENTER_V2 !== "false",
  SELLER_EXPERIENCE_V2: process.env.NEXT_PUBLIC_FEATURE_SELLER_EXPERIENCE_V2 !== "false",
  MARKETPLACE_INTELLIGENCE: process.env.NEXT_PUBLIC_FEATURE_MARKETPLACE_INTELLIGENCE !== "false",
  EDITORIAL_PLATFORM: process.env.NEXT_PUBLIC_FEATURE_EDITORIAL_PLATFORM !== "false",
  MOBILE_FIRST_V2: process.env.NEXT_PUBLIC_FEATURE_MOBILE_FIRST_V2 !== "false",
  PERFORMANCE_V2: process.env.NEXT_PUBLIC_FEATURE_PERFORMANCE_V2 !== "false",
  GAMIFICATION_V2: process.env.NEXT_PUBLIC_FEATURE_GAMIFICATION_V2 !== "false",
  AI_ASSISTANTS: process.env.NEXT_PUBLIC_FEATURE_AI_ASSISTANTS !== "false",
  ECOSYSTEM_PLATFORM: process.env.NEXT_PUBLIC_FEATURE_ECOSYSTEM_PLATFORM !== "false",
  LIVE_DATA_PLATFORM: process.env.NEXT_PUBLIC_FEATURE_LIVE_DATA_PLATFORM !== "false",
  SOCIAL_LAYER: process.env.NEXT_PUBLIC_FEATURE_SOCIAL_LAYER !== "false",
  TOURNAMENT_HUB: process.env.NEXT_PUBLIC_FEATURE_TOURNAMENT_HUB !== "false",
  RECOMMENDATION_ENGINE: process.env.NEXT_PUBLIC_FEATURE_RECOMMENDATION_ENGINE !== "false",
  /** Continuous product journey — shared invalidate + CTAs (no new BC). */
  PLAYER_JOURNEY_CONTINUITY: process.env.NEXT_PUBLIC_FEATURE_PLAYER_JOURNEY_CONTINUITY !== "false",
  /** Official Feature Freeze — block new product surface in UI. */
  FEATURE_FREEZE: process.env.NEXT_PUBLIC_FEATURE_FREEZE === "true",
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  /** Freeze is opt-in even in development — never force-enable. */
  if (key === "FEATURE_FREEZE") return FEATURES.FEATURE_FREEZE;
  const mode = (process.env.NEXT_PUBLIC_APP_MODE || "development").toLowerCase();
  if (mode === "sandbox" || mode === "development") return true;
  return FEATURES[key];
}
