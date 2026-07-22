import type { Metadata } from "next";
import { PublicProfileView } from "@/components/profile-v2/PublicProfileView";
import { withCanonical } from "@/lib/page-metadata";
import { brand } from "@/lib/brand";
import { publicProfilePath } from "@/lib/profile-v2";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const path = publicProfilePath(username, "wishlist");
  return withCanonical(path, {
    title: `Wishlist de ${username} | ${brand.shortName}`,
    description: `Wishlist pública de ${username} no JudgeTCG.`,
    openGraph: { title: `Wishlist de ${username}` },
    twitter: { card: "summary", title: `Wishlist de ${username}` },
  });
}

export default async function PublicWishlistPage({ params }: Props) {
  const { username } = await params;
  return <PublicProfileView username={username} section="wishlist" />;
}
