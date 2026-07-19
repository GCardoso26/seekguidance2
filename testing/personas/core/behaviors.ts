import type { SellerBehavior } from "./types.ts";

export const BEHAVIOR_PROFILES: Record<
  SellerBehavior,
  { description: string; publishesWeekly: boolean; buysStaples: boolean; collectsRares: boolean }
> = {
  weeklyPublisher: {
    description: "Publica listings com frequência semanal; estoque grande.",
    publishesWeekly: true,
    buysStaples: false,
    collectsRares: false,
  },
  competitiveSeller: {
    description: "Vende staples competitivos; reage a demanda.",
    publishesWeekly: true,
    buysStaples: true,
    collectsRares: false,
  },
  casualSeller: {
    description: "Publica ocasionalmente; estoque moderado.",
    publishesWeekly: false,
    buysStaples: false,
    collectsRares: false,
  },
  collectorOnly: {
    description: "Não vende; wishlist/favoritos de raridades.",
    publishesWeekly: false,
    buysStaples: false,
    collectsRares: true,
  },
  buyerOnly: {
    description: "Somente compra; sem loja.",
    publishesWeekly: false,
    buysStaples: true,
    collectsRares: false,
  },
  hybrid: {
    description: "Compra e vende; comportamento misto.",
    publishesWeekly: true,
    buysStaples: true,
    collectsRares: true,
  },
};
