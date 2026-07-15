import type { CardListing } from "@/types/card";

type ListingLike = Partial<CardListing> & {
  storeName?: string | null;
  store_name?: string | null;
  seller_name?: string | null;
  storeId?: string | null;
  imageUrl?: string | null;
};

/** Normaliza listagens do card detail (adapter pode enviar storeName sem sellerName). */
export function normalizeCardListing(raw: ListingLike, cardId?: string): CardListing {
  const sellerName =
    (typeof raw.sellerName === "string" && raw.sellerName.trim()) ||
    (typeof raw.storeName === "string" && raw.storeName.trim()) ||
    (typeof raw.store_name === "string" && raw.store_name.trim()) ||
    (typeof raw.seller_name === "string" && raw.seller_name.trim()) ||
    "Loja";

  const id = String(raw.id ?? "");
  const images =
    raw.images?.length ? raw.images : raw.imageUrl ? [String(raw.imageUrl)] : undefined;

  return {
    id,
    cardId: String(raw.cardId ?? cardId ?? ""),
    sellerId: String(raw.sellerId ?? raw.storeId ?? ""),
    sellerName,
    sellerReputation: Number.isFinite(raw.sellerReputation) ? Number(raw.sellerReputation) : 4.5,
    sellerAvatar: raw.sellerAvatar,
    condition: (raw.condition as CardListing["condition"]) || "NM",
    price: Number(raw.price) || 0,
    currency: raw.currency || "BRL",
    quantity: Number.isFinite(raw.quantity) ? Number(raw.quantity) : 0,
    foil: Boolean(raw.foil),
    language: raw.language || "pt",
    description: raw.description,
    images,
    createdAt: raw.createdAt || new Date(0).toISOString(),
    productId: raw.productId ?? (id || undefined),
    storeId: raw.storeId ?? undefined,
    cardName: raw.cardName,
    setName: raw.setName,
  };
}

export function sellerInitial(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}
