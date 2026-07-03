import { describe, expect, it } from "vitest";
import { addListingFormSchema } from "@/lib/seller-catalog-listing-form";
import { catalogCardsMock } from "@/lib/seller-catalog-mock";
import { SELLER_PRODUCT_CATEGORIES } from "@/lib/seller-product-categories";
import { sellerCustomersMock } from "@/lib/seller-customers-mock";
import { sellerTicketsMock } from "@/lib/seller-tickets-mock";

describe("useCatalogCards mocks", () => {
  it("returns lightning bolt in mock", () => {
    const data = catalogCardsMock();
    expect(data.cards.some((c) => c.name.includes("Lightning"))).toBe(true);
  });
});

describe("addListingFormSchema", () => {
  it("validates listing form", () => {
    const parsed = addListingFormSchema.safeParse({
      price: 45,
      quantity: 3,
      language: "pt",
      foil: false,
      condition: "NM",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("seller products categories", () => {
  it("includes sleeves and deck box", () => {
    const labels = SELLER_PRODUCT_CATEGORIES.map((c) => c.label);
    expect(labels).toContain("Sleeves");
    expect(labels).toContain("Deck Box");
  });
});

describe("seller customers mock", () => {
  it("has joao silva", () => {
    const data = sellerCustomersMock();
    expect(data.customers.some((c) => c.display_name?.includes("João"))).toBe(true);
  });
});

describe("support tickets mock", () => {
  it("filters open tickets", () => {
    const open = sellerTicketsMock("open");
    expect(open.tickets.every((t) => t.status === "open")).toBe(true);
  });
});
