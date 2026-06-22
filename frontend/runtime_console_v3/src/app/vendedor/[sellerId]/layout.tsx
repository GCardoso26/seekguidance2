import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { SellerProfileHeader, SellerTabs } from "@/components/seller/SellerProfileHeader";
import { fetchSellerProfile } from "@/lib/seller-api";

type Props = {
  children: React.ReactNode;
  params: Promise<{ sellerId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sellerId } = await params;
  const profile = await fetchSellerProfile(sellerId);
  if (!profile) {
    return { title: "Vendedor | Judge-TCG" };
  }
  return {
    title: `${profile.shop_name} | Vendedor Judge-TCG`,
    description:
      profile.bio ||
      `${profile.shop_name} — ${profile.active_listings} listagens, ${profile.total_sales} vendas. Compre cartas TCG com segurança.`,
    openGraph: {
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function SellerLayout({ children, params }: Props) {
  const { sellerId } = await params;
  const profile = await fetchSellerProfile(sellerId);
  if (!profile) notFound();

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
        <SellerProfileHeader sellerId={sellerId} profile={profile} />
        <SellerTabs sellerId={sellerId} />
        {children}
      </div>
    </MobileLayout>
  );
}
