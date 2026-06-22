import { SellerStatsPanel } from "@/components/seller/SellerStats";
import type { SellerStats } from "@/types/seller";

type Props = { params: Promise<{ sellerId: string }> };

export default async function SellerStatsPage({ params }: Props) {
  const { sellerId } = await params;
  const api = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");
  const res = await fetch(
    `${api}/runtime/judge/sellers/${encodeURIComponent(sellerId)}/stats?period=30d`,
    { next: { revalidate: 300 } },
  );
  const data = res.ok ? await res.json() : null;
  const stats = (data?.stats ?? {
    period: "30d",
    sales_count: 0,
    revenue_cents: 0,
    unique_buyers: 0,
    average_order_value_cents: 0,
    top_selling_cards: [],
    sales_by_game: [],
  }) as SellerStats;

  return <SellerStatsPanel stats={stats} />;
}
