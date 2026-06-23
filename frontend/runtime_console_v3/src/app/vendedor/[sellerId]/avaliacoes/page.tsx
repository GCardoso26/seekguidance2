import { SellerReviews } from "@/components/seller/SellerReviews";

type Props = { params: Promise<{ sellerId: string }> };

export default async function SellerReviewsPage({ params }: Props) {
  const { sellerId } = await params;
  return <SellerReviews sellerId={sellerId} />;
}
