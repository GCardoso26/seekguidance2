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
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  const mode = (process.env.NEXT_PUBLIC_APP_MODE || "development").toLowerCase();
  if (mode === "sandbox" || mode === "development") return true;
  return FEATURES[key];
}
