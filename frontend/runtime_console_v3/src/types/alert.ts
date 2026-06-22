export type AlertPriceCondition = "below" | "above";
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
  triggeredAt?: string | null;
}

export interface CreatePriceAlertInput {
  card_id: string;
  target_price: number;
  condition: AlertPriceCondition;
  target_condition?: string;
  target_foil?: boolean;
}
