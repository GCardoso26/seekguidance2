/**
 * Marketplace domain models (Sprint 4).
 *
 * Boundaries (ADR-007):
 *  - Seller → Inventory → Listing (Order = Sprint 5).
 *  - Listing references Catalog IDs; NEVER copies official data (name/oracle/artist).
 *  - No FK to Meilisearch — always Catalog IDs.
 */

export type SellerStatus = "pending" | "active" | "suspended";
export type SellerVerification = "unverified" | "pending" | "verified";

/** Aggregate 1 — who sells. No listings, no orders. */
export interface Seller {
  id: string;
  displayName: string;
  slug: string;
  status: SellerStatus;
  verification: SellerVerification;
  configuration: Record<string, unknown>;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerUpsert {
  id?: string;
  displayName: string;
  slug: string;
  status?: SellerStatus;
  verification?: SellerVerification;
  configuration?: Record<string, unknown>;
  expectedVersion?: number;
}

/** Aggregate 2 — how many cards exist. No price. */
export interface InventoryItem {
  id: string;
  sellerId: string;
  catalogCardId: string;
  catalogVariantId: string;
  quantity: number;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItemUpsert {
  id?: string;
  sellerId: string;
  catalogCardId: string;
  catalogVariantId: string;
  quantity: number;
  expectedVersion?: number;
}

export type ListingStatus = "draft" | "active" | "paused" | "sold_out";

/**
 * Aggregate 3 — how much it costs.
 * References Catalog + Inventory + Seller. Never copies official card data.
 */
export interface Listing {
  id: string;
  sellerId: string;
  /** Catalog reference — never denormalized name/oracle/artist. */
  catalogCardId: string;
  catalogVariantId: string;
  /** Optional link to the inventory lot this listing draws from. */
  inventoryItemId: string | null;
  priceCents: number;
  currency: "BRL";
  condition: string;
  language: string;
  notes: string | null;
  /** Finish choice — a reference to a catalog variant finish, not a creation. */
  finish: string | null;
  quantity: number;
  status: ListingStatus;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingUpsert {
  id?: string;
  sellerId: string;
  catalogCardId: string;
  catalogVariantId: string;
  inventoryItemId?: string | null;
  priceCents: number;
  currency?: "BRL";
  condition: string;
  language: string;
  notes?: string | null;
  finish?: string | null;
  quantity: number;
  status?: ListingStatus;
  expectedVersion?: number;
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
