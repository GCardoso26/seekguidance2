export type ReputationOverview = {
  trust_score: number;
  seller_level: string;
  badges: string[];
  alerts_count: number;
};

export type ReputationAlert = {
  type: string;
  severity: "high" | "medium" | "info";
  message: string;
};

export type SellerReputationResponse = {
  store_id: string;
  trust_score: number;
  seller_level: string;
  badges: string[];
  anti_fraud_flags: string[];
  components: Record<string, number>;
  orders_completed: number;
  review_avg: number;
  review_count: number;
  sla_violations: number;
  sla_detail: Record<string, number>;
  alerts: ReputationAlert[];
  reputation_status: string;
  calculated_at: string | null;
  version: number;
};
