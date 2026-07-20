/**
 * Shipping Provider Port — Checkout never imports Correios/ME/Jadlog/Kangu directly.
 */
export interface ShippingQuoteInput {
  originCep: string;
  destinationCep: string;
  weightGrams: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValueCents?: number;
}

export interface ShippingQuoteOption {
  provider: string;
  serviceCode: string;
  serviceName: string;
  priceCents: number;
  daysMin: number;
  daysMax: number;
  trackingSupported: boolean;
}

export interface ShippingTrackInput {
  trackingCode: string;
  provider?: string;
}

export interface ShippingTrackEvent {
  at: string;
  description: string;
  location?: string;
}

export interface ShippingProvider {
  readonly name: string;
  quote(input: ShippingQuoteInput): Promise<ShippingQuoteOption[]>;
  /** Interface preparada — implementação por adapter. */
  track?(input: ShippingTrackInput): Promise<ShippingTrackEvent[]>;
}

export type ShippingProviderName =
  | "melhor_envio"
  | "correios"
  | "jadlog"
  | "kangu"
  | "stub";
