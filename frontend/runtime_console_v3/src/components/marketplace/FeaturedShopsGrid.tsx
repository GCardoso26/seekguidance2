"use client";

import { useEffect, useState } from "react";
import { FeaturedSellerCard, type FeaturedSeller } from "@/components/marketplace/FeaturedSellerCard";

const FALLBACK: FeaturedSeller[] = [
  { id: "demo-1", shopName: "TCG Brasil", rating: 4.9, specialties: ["Magic", "Pokémon"], listingCount: 1200 },
  { id: "demo-2", shopName: "Card House SP", rating: 4.7, specialties: ["Yu-Gi-Oh!", "Lorcana"], listingCount: 850 },
  { id: "demo-3", shopName: "Mesa dos Judges", rating: 4.8, specialties: ["FaB", "One Piece"], listingCount: 420 },
];

export function FeaturedShopsGrid() {
  const [shops, setShops] = useState<FeaturedSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/featured-shops")
      .then((r) => r.json())
      .then((data: { shops?: Array<Record<string, unknown>> }) => {
        const seen = new Set<string>();
        const mapped: FeaturedSeller[] = [];
        for (const s of data.shops || []) {
          const id = String(s.id);
          if (!id || seen.has(id)) continue;
          seen.add(id);
          mapped.push({
            id,
            shopName: String(s.shop_name || "Loja"),
            avatarUrl: (s.avatar_url as string) || null,
            rating: Number(s.rating_average || 0),
            reviewCount: Number(s.rating_count || 0),
            listingCount: Number(s.listing_count || 0),
            specialties: (s.specialties as string[]) || [],
          });
        }
        setShops(mapped.length ? mapped : FALLBACK);
      })
      .catch(() => setShops(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4" data-testid="featured-shops-loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4" data-testid="featured-shops">
      {shops.map((seller) => (
        <FeaturedSellerCard key={seller.id} seller={seller} />
      ))}
    </div>
  );
}
