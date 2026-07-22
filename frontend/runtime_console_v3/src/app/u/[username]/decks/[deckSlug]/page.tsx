import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { withCanonical } from "@/lib/page-metadata";
import { brand } from "@/lib/brand";
import { publicProfilePath, slugifyDeckName } from "@/lib/profile-v2";

type Props = { params: Promise<{ username: string; deckSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, deckSlug } = await params;
  const path = publicProfilePath(username, `decks/${deckSlug}`);
  return withCanonical(path, {
    title: `${deckSlug} — ${username} | ${brand.shortName}`,
    description: `Deck ${deckSlug} de ${username} no JudgeTCG.`,
    openGraph: { title: `${deckSlug} — ${username}`, type: "article" },
    twitter: { card: "summary", title: `${deckSlug} — ${username}` },
  });
}

/**
 * URL amigável /u/{user}/decks/{slug}.
 * Resolve para lista pública do jogador quando o id do deck não está no path
 * (Social Layer pode mapear slug→id via API pública depois).
 */
export default async function PublicDeckSlugPage({ params }: Props) {
  const { username, deckSlug } = await params;
  const normalized = slugifyDeckName(deckSlug);
  if (normalized !== deckSlug) {
    redirect(publicProfilePath(username, `decks/${normalized}`));
  }
  redirect(publicProfilePath(username, "decks"));
}
