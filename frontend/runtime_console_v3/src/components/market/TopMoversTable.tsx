import type { TopMover } from "@/lib/market/top-movers";

interface TopMoversTableProps {
  gainers: TopMover[];
  losers: TopMover[];
  game: string;
}

export function TopMoversTable({ gainers, losers, game }: TopMoversTableProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <MoverList title="Maiores altas (7d)" items={gainers} game={game} positive />
      <MoverList title="Maiores quedas (7d)" items={losers} game={game} />
    </div>
  );
}

function MoverList({
  title,
  items,
  game,
  positive,
}: {
  title: string;
  items: TopMover[];
  game: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.cardId}>
              <a
                href={`/loja/cartas/${item.cardId}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/80"
              >
                <span className="truncate">{item.name}</span>
                <span
                  className={
                    positive
                      ? "shrink-0 text-emerald-400"
                      : "shrink-0 text-red-400"
                  }
                >
                  {item.changePct > 0 ? "+" : ""}
                  {item.changePct.toFixed(1)}%
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <a href={`/loja/${game}`} className="mt-3 inline-block text-xs text-primary">
        Ver loja {game.toUpperCase()} →
      </a>
    </div>
  );
}
