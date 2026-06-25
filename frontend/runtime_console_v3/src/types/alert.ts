export type AlertPriceCondition = "below" | "above" | "change_up" | "change_down";
export type AlertStatus = "active" | "triggered" | "disabled" | "expired";

export interface PriceAlert {
  id: string;
  cardId: string;
  cardName: string;
  cardImageUrl?: string | null;
  setName: string;
  targetPrice: number;
  targetPriceCents: number;
  condition: AlertPriceCondition;
  targetCondition?: string | null;
  targetFoil?: boolean | null;
  status: AlertStatus;
  currentPrice?: number | null;
  priceDifference?: number | null;
  emailNotified: boolean;
  pushNotified: boolean;
  createdAt: string;
  expiresAt: string;
  targetPercentage?: number | null;
  triggerCount?: number;
  triggeredAt?: string | null;
}

export interface CreatePriceAlertInput {
  card_id: string;
  target_price: number;
  condition: AlertPriceCondition;
  target_condition?: string;
  target_foil?: boolean;
  target_percentage?: number;
}
