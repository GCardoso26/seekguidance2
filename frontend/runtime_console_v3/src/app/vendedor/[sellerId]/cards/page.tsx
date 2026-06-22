import { SellerCardGrid } from "@/components/seller/SellerCardGrid";
import type { CardListing } from "@/types/card";

type Props = { params: Promise<{ sellerId: string }> };

export default async function SellerCardsPage({ params }: Props) {
  const { sellerId } = await params;
  const api = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");
  const res = await fetch(
    `${api}/runtime/judge/sellers/${encodeURIComponent(sellerId)}/listings?limit=24`,
    { next: { revalidate: 60 } },
  );
  const data = res.ok ? await res.json() : { listings: [], total: 0 };
  const listings = (data.listings ?? []) as CardListing[];

  return (
    <SellerCardGrid
      initialListings={listings}
      total={Number(data.total ?? listings.length)}
    />
  );
}
