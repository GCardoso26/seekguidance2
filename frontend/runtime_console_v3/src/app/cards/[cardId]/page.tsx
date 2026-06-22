import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardDetailJsonLd } from "@/components/cards/CardDetailJsonLd";
import { CardDetailPage } from "@/components/cards/CardDetailPage";
import type { CardDetailResponse } from "@/types/card";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

async function fetchCardDetail(cardId: string): Promise<CardDetailResponse | null> {
  try {
    const res = await fetch(
      `${API_BASE}/runtime/judge/catalog/cards/${encodeURIComponent(cardId)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    return res.json() as Promise<CardDetailResponse>;
  } catch {
    return null;
  }
}

type CardPageProps = {
  params: Promise<{ cardId: string }>;
};

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { cardId } = await params;
  const detail = await fetchCardDetail(cardId);

  if (!detail) {
    return { title: "Carta não encontrada | Judge-TCG" };
  }

  const { card } = detail;
  const lowestPrice = card.lowestPrice ?? card.latestPrice?.price;
  const currency = card.latestPrice?.currency || "USD";
  const priceText = lowestPrice
    ? `A partir de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(lowestPrice)}`
    : "Consulte preços e disponibilidade";

  return {
    title: `${card.name} — ${card.set?.name} | Judge-TCG`,
    description: `${card.name} de ${card.set?.name}. ${priceText}. Compre cartas de TCG com segurança.`,
    openGraph: {
      images: card.imageUris?.large ? [card.imageUris.large] : undefined,
    },
  };
}

export default async function CardPage({ params }: CardPageProps) {
  const { cardId } = await params;
  const detail = await fetchCardDetail(cardId);

  if (!detail) {
    notFound();
  }

  return (
    <>
      <CardDetailJsonLd card={detail.card} listings={detail.listings} />
      <CardDetailPage cardId={cardId} />
    </>
  );
}
