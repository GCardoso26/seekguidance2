"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Gamepad2 } from "lucide-react";
import { SUPPORTED_GAMES } from "@/lib/marketplace-games";
import { gameCardsPath } from "@/lib/game-routes";
import { cn } from "@/lib/utils";

export function HeaderGamePicker() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative hidden lg:block">
      <button
        type="button"
        data-testid="header-game-picker"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          open ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Gamepad2 className="h-4 w-4" />
        <span>Jogos</span>
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Fechar menu de jogos"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-2xl">
            <p className="mb-3 text-caption font-bold uppercase tracking-wider text-muted-foreground">
              Escolha seu jogo
            </p>
            <div className="grid max-h-64 grid-cols-2 gap-1 overflow-y-auto">
              {SUPPORTED_GAMES.slice(0, 8).map((game) => (
                <Link
                  key={game.id}
                  href={gameCardsPath(game.slug)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-muted/80"
                >
                  <Image src={game.logo_url} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                  <span className="truncate">{game.short_name}</span>
                </Link>
              ))}
            </div>
            <Link
              href="/loja"
              onClick={() => setOpen(false)}
              className="mt-3 block border-t border-border pt-3 text-xs text-primary hover:underline"
            >
              Ver todos os jogos →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
