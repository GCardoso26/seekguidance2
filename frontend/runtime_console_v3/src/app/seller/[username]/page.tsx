import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SellerProfilePageClient } from "@/components/seller-profile/SellerProfilePageClient";
import { sellerProfileMock } from "@/lib/seller-profile-mock";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  try {
    const seller = sellerProfileMock.getProfile(username);
    return {
      title: `${seller.display_name} — Loja no JudgeTCG`,
      description: seller.store_description ?? `Produtos de ${seller.display_name} no JudgeTCG Marketplace`,
    };
  } catch {
    return { title: "Vendedor | JudgeTCG" };
  }
}

export default async function SellerProfilePage({ params }: Props) {
  const { username } = await params;
  let seller = null;
  try {
    seller = sellerProfileMock.getProfile(username);
  } catch {
    seller = null;
  }
  if (!seller) notFound();
  return <SellerProfilePageClient seller={seller} />;
}
