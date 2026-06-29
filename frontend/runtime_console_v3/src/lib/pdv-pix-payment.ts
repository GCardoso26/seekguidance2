import { z } from "zod";
import type { PdvCartItem } from "@/types/pdv";
import { pdvSaleItemSchema } from "@/lib/pdv-sale-form";

export const pdvPixItemsSchema = z.object({
  items: z.array(pdvSaleItemSchema).min(1, "Carrinho vazio"),
});

export const pdvPixStatusSchema = z.object({
  status: z.enum(["pending", "paid", "expired"]),
  transaction_id: z.string().optional(),
  sale_id: z.string().nullable().optional(),
});

export type PdvPixStatus = z.infer<typeof pdvPixStatusSchema>;

export const PDV_PIX_POLL_MS = 3000;
export const PDV_PIX_TIMEOUT_MS = 5 * 60 * 1000;

export function pdvPixRequestPayload(items: PdvCartItem[]) {
  return {
    items: items.map((item) => ({
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      price_cents: item.price_cents,
    })),
  };
}

export function parsePdvPixStatus(data: unknown) {
  return pdvPixStatusSchema.safeParse(data);
}

export function shouldStopPixPolling(status: PdvPixStatus["status"]) {
  return status === "paid" || status === "expired";
}
