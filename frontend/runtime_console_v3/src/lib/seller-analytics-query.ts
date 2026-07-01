export type SellerBadge = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export type SellerTopGame = {
  game_slug: string;
  game_name: string;
  listing_count: number;
  sales_count: number;
};

export type SellerPublicMetrics = {
  total_sales: number;
  total_listings_active: number;
  total_listings_sold: number;
  sell_through_rate: number;
  average_ship_time_hours: number | null;
  response_time_hours: number | null;
  member_since: string | null;
  last_active: string | null;
};

export type SellerRatingSummary = {
  average_rating: number;
  total_reviews: number;
  distribution: Record<string, number>;
};

export type SellerRecentActivity = {
  sales_last_30d: number;
  new_listings_last_30d: number;
  trend: "up" | "down" | "stable";
};

export type SellerSparklinePoint = {
  date: string;
  sales: number;
};

export type SellerAnalyticsResponse = {
  seller_id: string;
  username: string;
  store_name: string;
  public_metrics: SellerPublicMetrics;
  rating_summary: SellerRatingSummary;
  top_games: SellerTopGame[];
  recent_activity: SellerRecentActivity;
  activity_sparkline?: SellerSparklinePoint[];
  badges: SellerBadge[];
  cached?: boolean;
};
