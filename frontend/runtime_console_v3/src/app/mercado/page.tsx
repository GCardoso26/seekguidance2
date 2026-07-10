import { HealthScoreCard } from "@/components/market/HealthScoreCard";
import { TopMoversTable } from "@/components/market/TopMoversTable";
import { calculateHealthScore } from "@/lib/market/health-score";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Índice de Mercado",
  description: "Health score e tendências do mercado de TCGs no Judge TCG.",
};

export const revalidate = 3600;

const GAMES = ["mtg", "pokemon", "yugioh", "lorcana", "onepiece"];

export default async function MercadoPage() {
  const scores = await Promise.all(GAMES.map((game) => calculateHealthScore(game)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Índice de Mercado</h1>
        <p className="mt-2 text-muted-foreground">
          Liquidez, estabilidade e sentimento por TCG — atualizado pelo cron semanal.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {scores.map((score) => (
          <HealthScoreCard key={score.game} data={score} />
        ))}
      </div>

      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Top movers — MTG</h2>
        <TopMoversTable
          game="mtg"
          gainers={scores.find((s) => s.game === "mtg")?.topGainers ?? []}
          losers={scores.find((s) => s.game === "mtg")?.topLosers ?? []}
        />
      </section>
    </main>
  );
}
