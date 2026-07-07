import { describe, expect, it } from "vitest";
import {
  applyBulkPrice,
} from "@/components/seller-dashboard/listings/BulkListingsModals";
import {
  archiveListingPatch,
  exportListingsCsv,
} from "@/lib/seller-bulk-listings";
import type { SellerListingRow } from "@/types/seller-listing";

const row = (id: string, price: number): SellerListingRow => ({
  id,
  cardId: "card-1",
  sellerId: "s1",
  sellerName: "Loja",
  sellerReputation: 90,
  condition: "NM",
  price,
  currency: "BRL",
  quantity: 2,
  foil: false,
  language: "pt",
  createdAt: "2026-01-01",
});

describe("seller-bulk-listings", () => {
  it("archiveListingPatch retorna inactive", () => {
    expect(archiveListingPatch()).toEqual({ status: "inactive" });
  });

  it("exportListingsCsv gera cabeçalho e linhas", () => {
    const csv = exportListingsCsv([{ ...row("a", 10), cardName: "Bolt", setName: "DMU" }]);
    expect(csv).toContain("cardName");
    expect(csv).toContain("Bolt");
  });

  it("applyBulkPrice ajusta percentual", () => {
    const patches = applyBulkPrice([row("a", 100)], ["a"], "percent", 10);
    expect(patches.a).toBe(110);
  });

  it("applyBulkPrice define valor fixo", () => {
    const patches = applyBulkPrice([row("a", 100)], ["a"], "fixed", 25);
    expect(patches.a).toBe(25);
  });
});
