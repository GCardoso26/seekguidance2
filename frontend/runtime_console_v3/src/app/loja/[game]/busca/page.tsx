export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { gameSearchMetadata } from "@/lib/seo-metadata";
import { GameBuscaClient } from "./GameBuscaClient";

type Props = {
  params: Promise<{ game: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { game } = await params;
  const { q } = await searchParams;
  return gameSearchMetadata(game, q);
}

export default async function GameBuscaPage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  return <GameBuscaClient slug={game} />;
}
