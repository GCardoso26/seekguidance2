import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PLACEHOLDER_MOVERS = [
  { name: "Lightning Bolt", set: "Modern Horizons 3", change: 12.4, up: true },
  { name: "Charizard ex", set: "Obsidian Flames", change: -8.2, up: false },
  { name: "Black Lotus", set: "Alpha", change: 5.1, up: true },
  { name: "Sol Ring", set: "Commander Masters", change: 3.7, up: true },
];

export function TopMoversPlaceholder() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PLACEHOLDER_MOVERS.map((item) => (
        <Card
          key={item.name}
          className="border-border/60 bg-card/50 transition hover:border-primary/30"
        >
          <CardContent className="p-4">
            <div className="mb-3 aspect-[63/88] rounded-md bg-muted/40" aria-hidden />
            <p className="truncate font-medium">{item.name}</p>
            <p className="truncate text-xs text-muted-foreground">{item.set}</p>
            <div
              className={`mt-2 flex items-center gap-1 text-sm font-medium ${
                item.up ? "text-success" : "text-danger"
              }`}
            >
              {item.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {item.up ? "+" : ""}
              {item.change}% (7d)
            </div>
            <Link
              href="/loja/busca"
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              Ver detalhes →
            </Link>
          </CardContent>
        </Card>
      ))}
      <p className="col-span-full text-center text-xs text-muted-foreground">
        Dados reais de tendências chegam na Fase 1.4 (Top Movers).
      </p>
    </div>
  );
}
