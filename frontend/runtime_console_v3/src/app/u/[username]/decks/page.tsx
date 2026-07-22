import type { Metadata } from "next";
import { PublicProfileView } from "@/components/profile-v2/PublicProfileView";
import { withCanonical } from "@/lib/page-metadata";
import { brand } from "@/lib/brand";
import { publicProfilePath } from "@/lib/profile-v2";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const path = publicProfilePath(username, "decks");
  return withCanonical(path, {
    title: `Decks de ${username} | ${brand.shortName}`,
    description: `Decks públicos de ${username} no JudgeTCG.`,
    openGraph: { title: `Decks de ${username}` },
    twitter: { card: "summary", title: `Decks de ${username}` },
  });
}

export default async function PublicDecksPage({ params }: Props) {
  const { username } = await params;
  return <PublicProfileView username={username} section="decks" />;
}
