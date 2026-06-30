import { z } from "zod";
import type { PriceAlertType, WishlistPriceAlert } from "@/types/wishlist-price-alert";

export const WISHLIST_PRICE_ALERTS_QUERY_KEY = ["wishlist-price-alerts"] as const;

export const priceAlertFormSchema = z
  .object({
    alert_type: z.enum(["any_drop", "target_price", "percentage_drop"]),
    target_price_reais: z.union([z.coerce.number().min(0.01), z.literal("")]).optional(),
    percentage: z.union([z.coerce.number().min(1).max(99), z.literal("")]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.alert_type === "target_price") {
      const v = data.target_price_reais;
      if (v === "" || v === undefined || Number(v) <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o preço alvo",
          path: ["target_price_reais"],
        });
      }
    }
    if (data.alert_type === "percentage_drop") {
      const v = data.percentage;
      if (v === "" || v === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe a porcentagem",
          path: ["percentage"],
        });
      }
    }
  });

export type PriceAlertFormValues = z.infer<typeof priceAlertFormSchema>;

export function formToAlertPayload(values: PriceAlertFormValues, baselinePriceCents: number) {
  const target_price =
    values.alert_type === "target_price" && values.target_price_reais !== ""
      ? Math.round(Number(values.target_price_reais) * 100)
      : null;
  const percentage =
    values.alert_type === "percentage_drop" && values.percentage !== ""
      ? Number(values.percentage)
      : null;

  return {
    alert_type: values.alert_type as PriceAlertType,
    target_price,
    percentage,
    baseline_price_cents: baselinePriceCents,
    is_active: true,
  };
}

type AlertRule = Pick<
  WishlistPriceAlert,
  "alert_type" | "target_price" | "percentage" | "is_active"
>;

/**
 * Decide se um alerta deve disparar comparando preço anterior e atual (centavos).
 * Não alerta se o preço subiu ou permaneceu igual.
 */
export function shouldAlert(
  currentPriceCents: number,
  previousPriceCents: number,
  alert: AlertRule,
): boolean {
  if (!alert.is_active) return false;
  if (currentPriceCents >= previousPriceCents) return false;

  switch (alert.alert_type) {
    case "any_drop":
      return true;
    case "target_price":
      return alert.target_price != null && currentPriceCents <= alert.target_price;
    case "percentage_drop": {
      if (alert.percentage == null || previousPriceCents <= 0) return false;
      const dropPct = ((previousPriceCents - currentPriceCents) / previousPriceCents) * 100;
      return dropPct >= alert.percentage;
    }
    default:
      return false;
  }
}

export function priceAlertLabel(alert: WishlistPriceAlert): string {
  switch (alert.alert_type) {
    case "any_drop":
      return "Qualquer redução";
    case "target_price":
      return alert.target_price != null
        ? `Até ${(alert.target_price / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
        : "Preço alvo";
    case "percentage_drop":
      return alert.percentage != null ? `Queda de ${alert.percentage}%+` : "Queda percentual";
  }
}

export function normalizeAlertsResponse(data: unknown): WishlistPriceAlert[] {
  const raw = data as { alerts?: unknown[] };
  if (!Array.isArray(raw?.alerts)) return [];
  return raw.alerts.filter(isWishlistPriceAlert);
}

function isWishlistPriceAlert(value: unknown): value is WishlistPriceAlert {
  if (!value || typeof value !== "object") return false;
  const a = value as WishlistPriceAlert;
  return Boolean(a.id && a.product_id && a.alert_type);
}
