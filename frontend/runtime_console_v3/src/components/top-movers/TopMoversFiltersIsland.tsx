"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const GAMES = [
  { id: "", label: "Todos" },
  { id: "mtg", label: "Magic" },
  { id: "pokemon", label: "Pokémon" },
  { id: "yugioh", label: "Yu-Gi-Oh!" },
  { id: "lorcana", label: "Lorcana" },
  { id: "onepiece", label: "One Piece" },
];

const PERIODS = ["24h", "7d", "30d", "90d"];
const SORTS = [
  { id: "alta", label: "Alta" },
  { id: "queda", label: "Queda" },
  { id: "liquidez", label: "Liquidez" },
  { id: "volume", label: "Volume" },
];

export function TopMoversFiltersIsland() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const setParam = useCallback(
    (key: string, value: string, eventName: "top_movers_filter" | "top_movers_sort") => {
      const next = new URLSearchParams(params.toString());
      if (!value) next.delete(key);
      else next.set(key, value);
      void trackEvent(eventName, { [key]: value || "all" });
      start(() => {
        router.push(`/loja/tendencias?${next.toString()}`);
      });
    },
    [params, router],
  );

  const game = params.get("game") ?? "";
  const period = params.get("period") ?? "7d";
  const sort = params.get("sort") ?? "alta";
  const foil = params.get("foil") ?? "";

  return (
    <section
      className={cn("space-y-4 rounded-xl border border-border bg-card/40 p-4", pending && "opacity-70")}
      aria-label="Filtros Top Movers"
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Jogo">
        {GAMES.map((g) => (
          <Button
            key={g.id || "all"}
            type="button"
            size="sm"
            variant={game === g.id ? "default" : "outline"}
            onClick={() => setParam("game", g.id, "top_movers_filter")}
          >
            {g.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Período">
        {PERIODS.map((p) => (
          <Badge
            key={p}
            className={cn("cursor-pointer select-none", period === p && "ring-2 ring-primary")}
            role="button"
            tabIndex={0}
            onClick={() => setParam("period", p, "top_movers_filter")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setParam("period", p, "top_movers_filter");
              }
            }}
          >
            {p}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Ordenação">
        {SORTS.map((s) => (
          <Button
            key={s.id}
            type="button"
            size="sm"
            variant={sort === s.id ? "default" : "ghost"}
            onClick={() => setParam("sort", s.id, "top_movers_sort")}
          >
            {s.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Foil">
        <Button
          type="button"
          size="sm"
          variant={foil === "" ? "default" : "outline"}
          onClick={() => setParam("foil", "", "top_movers_filter")}
        >
          Qualquer
        </Button>
        <Button
          type="button"
          size="sm"
          variant={foil === "1" ? "default" : "outline"}
          onClick={() => setParam("foil", "1", "top_movers_filter")}
        >
          Só foil
        </Button>
      </div>
    </section>
  );
}
