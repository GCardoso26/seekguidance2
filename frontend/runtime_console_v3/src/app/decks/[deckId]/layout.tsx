import type { Metadata } from "next";

const API_BASE = (process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || "https://seekguidance.onrender.com").replace(
  /\/$/,
  "",
);

type Props = {
  children: React.ReactNode;
  params: Promise<{ deckId: string }>;
};

async function fetchDeck(deckId: string) {
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/decks/${encodeURIComponent(deckId)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { deck?: Record<string, unknown> };
    return data.deck ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deckId } = await params;
  const deck = await fetchDeck(deckId);

  if (!deck || deck.is_public === false) {
    return {
      title: "Deck não encontrado",
      robots: { index: false, follow: false },
    };
  }

  const name = String(deck.name || "Deck");
  const format = String(deck.format || deck.game || "TCG");
  const owner = (deck.owner as { display_name?: string } | null)?.display_name || "Jogador";
  const totalCards = Number(deck.total_cards || 0);

  return {
    title: `${name} — Deck ${format}`,
    description: `Deck ${name} para ${format}. ${totalCards} cartas. Criado por ${owner}.`,
    openGraph: {
      title: name,
      description: `Deck ${format} · ${totalCards} cartas · por ${owner}`,
      type: "article",
    },
  };
}

export default function DeckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
