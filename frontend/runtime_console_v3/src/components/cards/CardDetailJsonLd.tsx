import type { CardListing, UnifiedCard } from "@/types/card";

export function generateSchemaOrgJsonLd(card: UnifiedCard, listings: CardListing[]): object {
  const lowestPrice = card.lowestPrice ?? card.latestPrice?.price;
  const prices = listings.map((l) => l.price).filter((p) => p > 0);
  const highPrice = prices.length ? Math.max(...prices, lowestPrice ?? 0) : lowestPrice;
  const inStock = listings.some((l) => l.quantity > 0);
  const currency = card.latestPrice?.currency || listings[0]?.currency || "USD";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: card.name,
    image: [card.imageUris?.large, card.imageUris?.normal].filter(Boolean),
    description: card.oracleText || `${card.name} — ${card.set?.name}`,
    brand: {
      "@type": "Brand",
      name: card.game,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: currency,
      lowPrice: lowestPrice,
      highPrice: highPrice,
      offerCount: listings.reduce((sum, l) => sum + l.quantity, 0),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  if (listings.length > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (
        listings.reduce((sum, l) => sum + l.sellerReputation, 0) / listings.length
      ).toFixed(1),
      reviewCount: listings.length,
    };
  }

  return schema;
}

interface CardDetailJsonLdProps {
  card: UnifiedCard;
  listings: CardListing[];
}

export function CardDetailJsonLd({ card, listings }: CardDetailJsonLdProps) {
  const jsonLd = generateSchemaOrgJsonLd(card, listings);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
