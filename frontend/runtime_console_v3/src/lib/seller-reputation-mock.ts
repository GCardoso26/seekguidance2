import type { SellerReputationResponse } from "@/types/seller-reputation";

export function sellerReputationMock(): SellerReputationResponse {
  return {
    store_id: "store-demo",
    trust_score: 82.5,
    seller_level: "silver",
    badges: ["verified_seller", "sla_excellent"],
    anti_fraud_flags: [],
    components: {
      sales: 85,
      delivery: 88,
      quality: 79,
      compliance: 80,
      fraud_penalty: 0,
    },
    orders_completed: 42,
    review_avg: 4.6,
    review_count: 18,
    sla_violations: 0,
    sla_detail: {
      picking_overdue: 0,
      packing_overdue: 0,
      shipping_overdue: 0,
      tracking_delayed: 0,
    },
    alerts: [],
    reputation_status: "Updated",
    calculated_at: new Date().toISOString(),
    version: 3,
  };
}

export function sellerReputationOverviewMock() {
  return {
    trust_score: 82.5,
    seller_level: "silver",
    badges: ["verified_seller"],
    alerts_count: 0,
  };
}
