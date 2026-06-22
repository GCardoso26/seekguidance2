export const dynamic = "force-dynamic";
export const revalidate = 0;

import { GameBuscaClient } from "./GameBuscaClient";

export default async function GameBuscaPage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  return <GameBuscaClient slug={game} />;
}
