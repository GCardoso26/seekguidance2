export type Store = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  city?: string;
  state?: string;
  country?: string;
  verification_status?: string;
  verified?: boolean;
  average_rating?: number;
  review_count?: number;
  email?: string;
  trust_tier?: string | { id: string; label: string; emoji?: string } | null;
};

export type StoresResponse = {
  stores: Store[];
  total: number;
};
