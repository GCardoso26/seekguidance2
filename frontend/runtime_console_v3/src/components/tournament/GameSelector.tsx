"use client";

import Image from "next/image";
import type { GameCode } from "@/lib/tcg-adapters";
import { TOURNAMENT_GAMES } from "@/lib/tcg-adapters";
import { getTcgLogoBySlug } from "@/lib/tcg-logos";

type Props = {
  value: GameCode | null;
  onChange: (code: GameCode) => void;
};

export function GameSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {TOURNAMENT_GAMES.map((game) => {
        const logo = getTcgLogoBySlug(game.slug);
        const selected = value === game.code;
        return (
          <button
            key={game.code}
            type="button"
            data-testid={`game-select-${game.slug}`}
            onClick={() => onChange(game.code)}
            className={`flex flex-col items-center gap-3 rounded-xl border p-6 transition-all ${
              selected
                ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400"
                : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
            }`}
          >
            <Image src={logo.src} alt={logo.alt} width={64} height={64} />
            <span className="text-center text-sm font-semibold text-slate-100">{game.name}</span>
          </button>
        );
      })}
    </div>
  );
}
