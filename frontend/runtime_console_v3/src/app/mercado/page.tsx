import { HealthScoreCard } from "@/components/market/HealthScoreCard";
import { calculateHealthScore } from "@/lib/market/health-score";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Índice de Mercado",
  description: "Health score e tendências do mercado de TCGs no Judge TCG.",
};

const GAMES = ["mtg", "pokemon", "yugioh", "lorcana", "onepiece"];

export default async function MercadoPage() {
  const scores = await Promise.all(GAMES.map((game) => calculateHealthScore(game)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-luxury-frost">Índice de Mercado</h1>
        <p className="mt-2 text-luxury-mist">
          Liquidez, estabilidade e sentimento por TCG — atualizado semanalmente.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {scores.map((score) => (
          <HealthScoreCard key={score.game} data={score} />
        ))}
      </div>
    </main>
  );
}
