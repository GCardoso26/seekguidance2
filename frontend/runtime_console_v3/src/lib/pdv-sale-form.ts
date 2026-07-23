import { z } from "zod";
import type { PdvCartItem, PdvPaymentMethod } from "@/types/pdv";

export const pdvSaleItemSchema = z.object({
  product_id: z.string().nullable().optional(),
  local_product_id: z.string().nullable().optional(),
  source: z.enum(["official", "local"]).default("official"),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  price_cents: z.number().int().min(0),
});

export const pdvSaleFormSchema = z.object({
  items: z.array(pdvSaleItemSchema).min(1, "Carrinho vazio"),
  payment_method: z.enum(["cash", "pix", "card"]),
  notes: z.string().max(500).optional(),
});

export type PdvSaleFormValues = z.infer<typeof pdvSaleFormSchema>;

export function parsePdvSaleForm(data: unknown) {
  return pdvSaleFormSchema.safeParse(data);
}

export function cartTotalCents(items: PdvCartItem[]): number {
  return items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
}

function cartLineKey(item: Pick<PdvCartItem, "source" | "product_id" | "local_product_id">): string {
  if (item.source === "local") return `local:${item.local_product_id ?? item.product_id}`;
  return `official:${item.product_id}`;
}

export { cartLineKey };

/** Payload para POST /api/marketplace/shop/stores/{storeId}/pdv */
export function pdvSaleToApiPayload(
  items: PdvCartItem[],
  paymentMethod: PdvPaymentMethod,
  notes?: string,
) {
  return {
    items: items.map((item) => ({
      product_id: item.source === "official" ? item.product_id : null,
      local_product_id: item.source === "local" ? (item.local_product_id ?? item.product_id) : null,
      source: item.source,
      name: item.name,
      quantity: item.quantity,
      price_cents: item.price_cents,
    })),
    payment_method: paymentMethod,
    notes: notes?.trim() || undefined,
  };
}

export function buildPdvSaleFormValues(
  items: PdvCartItem[],
  paymentMethod: PdvPaymentMethod,
  notes?: string,
): PdvSaleFormValues {
  return {
    items: items.map((item) => ({
      product_id: item.source === "official" ? item.product_id : null,
      local_product_id: item.source === "local" ? (item.local_product_id ?? item.product_id) : null,
      source: item.source,
      name: item.name,
      quantity: item.quantity,
      price_cents: item.price_cents,
    })),
    payment_method: paymentMethod,
    notes,
  };
}
