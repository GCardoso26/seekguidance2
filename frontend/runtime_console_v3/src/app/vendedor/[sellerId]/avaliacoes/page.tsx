import { SellerReviewList } from "@/components/seller/SellerReviewList";
import type { SellerReview } from "@/types/seller";

type Props = { params: Promise<{ sellerId: string }> };

export default async function SellerReviewsPage({ params }: Props) {
  const { sellerId } = await params;
  const api = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");
  const res = await fetch(
    `${api}/runtime/judge/sellers/${encodeURIComponent(sellerId)}/reviews?limit=20`,
    { next: { revalidate: 120 } },
  );
  const data = res.ok ? await res.json() : { reviews: [], total: 0 };
  const reviews = (data.reviews ?? []) as SellerReview[];

  return <SellerReviewList reviews={reviews} total={Number(data.total ?? reviews.length)} />;
}
