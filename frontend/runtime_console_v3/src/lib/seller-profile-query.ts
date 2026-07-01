export type SellerUserType = "normal" | "professional";

export type SellerPolicies = {
  shipping?: string;
  returns?: string;
  grading?: string;
};

export type MarketplaceSellerProfile = {
  id: number;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  country_code: string;
  country_name?: string;
  user_type: SellerUserType;
  rating: number;
  total_reviews: number;
  total_items: number;
  unique_items: number;
  response_time_hours?: number;
  can_sell_via_hub: boolean;
  on_vacation: boolean;
  store_description?: string;
  policies?: SellerPolicies;
  joined_at?: string;
  last_active_at?: string;
};

export type SellerProductPrice = {
  cents: number;
  currency: string;
};

export type SellerProductExpansion = {
  id: number;
  code: string;
  name_en: string;
};

export type SellerProduct = {
  id: number;
  blueprint_id?: number;
  name_en: string;
  name_pt?: string;
  quantity: number;
  price: SellerProductPrice;
  condition: string;
  language: string;
  foil: boolean;
  signed: boolean;
  altered: boolean;
  graded: boolean;
  expansion?: SellerProductExpansion;
  image_url?: string;
};

export type SellerProductFilters = {
  condition?: string;
  foil?: boolean;
  signed?: boolean;
  altered?: boolean;
  graded?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "name";
  gameId?: string;
};

export type SellerListResponse = {
  sellers: MarketplaceSellerProfile[];
  total: number;
  page: number;
  limit: number;
};

export type SellerProductsResponse = {
  products: SellerProduct[];
  total: number;
  page: number;
  limit: number;
};
