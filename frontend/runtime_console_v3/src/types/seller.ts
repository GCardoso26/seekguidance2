export interface SellerProfile {
  id: string;
  user_id: string;
  handle?: string | null;
  shop_name: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  bio: string;
  location: string;
  store_id?: string | null;
  store_slug?: string | null;
  total_sales: number;
  total_revenue_cents: number;
  rating_average: number;
  rating_count: number;
  positive_rate: number;
  active_listings: number;
  member_since?: string | null;
  is_verified: boolean;
}

export interface SellerReview {
  id: string;
  order_id?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_avatar?: string | null;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface SellerStats {
  period: "7d" | "30d" | "90d" | "all";
  sales_count: number;
  revenue_cents: number;
  unique_buyers: number;
  average_order_value_cents: number;
  top_selling_cards: { card_name: string; count: number }[];
  sales_by_game: { game_name: string; count: number; revenue: number }[];
}

export interface CheckoutSessionInfo {
  session_id: string;
  expires_at: string;
  locked_items: Array<{
    product_id: string;
    quantity: number;
    product_name?: string;
  }>;
  total_cents?: number;
  status?: string;
}
