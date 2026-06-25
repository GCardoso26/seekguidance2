"use client";

import { Command } from "cmdk";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cardImageUrl, formatCurrency } from "@/lib/format-currency";
import type { CatalogSearchResponse, UnifiedCard } from "@/types/card";
import { Search } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cards, setCards] = useState<UnifiedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((value) => !value);
      }
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "1") {
          e.preventDefault();
          router.push("/loja/mtg");
        }
        if (e.key === "2") {
          e.preventDefault();
          router.push("/decks");
        }
        if (e.key === "3") {
          e.preventDefault();
          router.push("/perfil");
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router]);

  const fetchCards = useCallback(async (q: string) => {
    if (q.length < 2) {
      setCards([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: "6" });
      const res = await fetch(`/api/catalog/cards/search?${params}`);
      if (res.ok) {
        const data = (await res.json()) as CatalogSearchResponse;
        setCards(data.cards ?? []);
      }
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void fetchCards(search.trim()), 200);
    return () => clearTimeout(timer);
  }, [search, fetchCards]);

  const navigate = (href: string) => {
    router.push(href);
    setOpen(false);
    setSearch("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="mx-auto mt-[12vh] w-full max-w-xl px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          label="Busca global"
          className="overflow-hidden rounded-xl border border-white/10 bg-luxury-obsidian shadow-2xl"
          shouldFilter={false}
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-3">
            <Search className="h-4 w-4 text-luxury-mist" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar cartas, decks, lojas…"
              className="h-12 w-full bg-transparent text-sm text-luxury-frost outline-none placeholder:text-luxury-mist"
              autoFocus
            />
            <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-xs text-luxury-mist sm:inline">
              Esc
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-luxury-mist">
              {loading ? "Buscando…" : "Nenhum resultado encontrado."}
            </Command.Empty>

            {cards.length > 0 && (
              <Command.Group heading="Cartas" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-luxury-mist">
                {cards.map((card) => {
                  const price = card.lowestPrice ?? card.latestPrice?.price;
                  const img = cardImageUrl(card);
                  return (
                    <Command.Item
                      key={card.id}
                      value={card.id}
                      onSelect={() => navigate(`/loja/cartas/${card.id}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 aria-selected:bg-white/5"
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded">
                        <Image src={img} alt="" fill className="object-cover" sizes="32px" unoptimized={img.endsWith(".svg")} />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm">{card.name}</span>
                      {price !== undefined && (
                        <span className="text-xs text-emerald-400">
                          {formatCurrency(price, card.latestPrice?.currency ?? "USD")}
                        </span>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            <Command.Group heading="Navegação" className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-luxury-mist">
              <Command.Item onSelect={() => navigate("/loja/mtg")} className="rounded-lg px-2 py-2 aria-selected:bg-white/5">
                Ir para Loja MTG
              </Command.Item>
              <Command.Item onSelect={() => navigate("/decks")} className="rounded-lg px-2 py-2 aria-selected:bg-white/5">
                Ir para Decks
              </Command.Item>
              <Command.Item onSelect={() => navigate("/mercado")} className="rounded-lg px-2 py-2 aria-selected:bg-white/5">
                Índice de Mercado
              </Command.Item>
              <Command.Item onSelect={() => navigate("/perfil")} className="rounded-lg px-2 py-2 aria-selected:bg-white/5">
                Ir para Perfil
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
