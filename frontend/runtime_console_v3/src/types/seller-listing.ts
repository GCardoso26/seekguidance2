import type { CardListing } from "@/types/card";

/** Listagem do vendedor com campos extras retornados pela API seller. */
export type SellerListingRow = CardListing & {
  status?: string;
};

export const LISTING_STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  inactive: "Inativa",
  sold: "Vendida",
  reserved: "Reservada",
};
