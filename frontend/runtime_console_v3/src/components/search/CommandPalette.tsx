"use client";

import { Command } from "cmdk";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cardImageUrl, formatCurrency } from "@/lib/format-currency";
import type { CatalogSearchResponse, UnifiedCard } from "@/types/card";
import {
  LayoutDashboard,
  ListChecks,
  Search,
  ShoppingBag,
  Store,
  TrendingUp,
} from "lucide-react";

const RECENTS_KEY = "judge-cmdk-recents";
const MAX_RECENTS = 6;

type RecentItem = { id: string; name: string; href: string };

function loadRecents(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as RecentItem[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(item: RecentItem) {
  const prev = loadRecents().filter((r) => r.id !== item.id);
  const next = [item, ...prev].slice(0, MAX_RECENTS);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  return next;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [cards, setCards] = useState<UnifiedCard[]>([]);
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  useEffect(() => {
    if (open) setRecents(loadRecents());
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((value) => !value);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
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
  }, [router, open, close]);

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

  const navigate = (href: string, recent?: RecentItem) => {
    if (recent) {
      setRecents(saveRecent(recent));
    }
    router.push(href);
    close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={close}>
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

            {search.length < 2 && recents.length > 0 && (
              <Command.Group
                heading="Recentes"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-luxury-mist"
              >
                {recents.map((r) => (
                  <Command.Item
                    key={r.id}
                    value={`recent-${r.id}`}
                    onSelect={() => navigate(r.href)}
                    className="cursor-pointer rounded-lg px-2 py-2 aria-selected:bg-white/5"
                  >
                    {r.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {cards.length > 0 && (
              <Command.Group
                heading="Cartas"
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-luxury-mist"
              >
                {cards.map((card) => {
                  const price = card.lowestPrice ?? card.latestPrice?.price;
                  const img = cardImageUrl(card);
                  const href = `/loja/cartas/${card.id}`;
                  return (
                    <Command.Item
                      key={card.id}
                      value={card.id}
                      onSelect={() =>
                        navigate(href, { id: card.id, name: card.name, href })
                      }
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 aria-selected:bg-white/5"
                    >
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded">
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
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

            <Command.Group
              heading="Navegação"
              className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-luxury-mist"
            >
              <Command.Item
                onSelect={() => navigate("/loja/mtg")}
                className="flex items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-white/5"
              >
                <ShoppingBag className="h-4 w-4 text-luxury-mist" />
                Ir para Loja MTG
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/decks")}
                className="rounded-lg px-2 py-2 aria-selected:bg-white/5"
              >
                Ir para Decks
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/mercado")}
                className="flex items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-white/5"
              >
                <TrendingUp className="h-4 w-4 text-luxury-mist" />
                Índice de Mercado
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/perfil")}
                className="rounded-lg px-2 py-2 aria-selected:bg-white/5"
              >
                Ir para Perfil
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading="Ações"
              className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-luxury-mist"
            >
              <Command.Item
                onSelect={() => navigate("/stores/create")}
                className="flex items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-white/5"
              >
                <Store className="h-4 w-4 text-luxury-mist" />
                Criar loja
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/vendedor/painel")}
                className="flex items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-white/5"
              >
                <LayoutDashboard className="h-4 w-4 text-luxury-mist" />
                Painel do vendedor
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/vendedor/painel/buylist")}
                className="flex items-center gap-2 rounded-lg px-2 py-2 aria-selected:bg-white/5"
              >
                <ListChecks className="h-4 w-4 text-luxury-mist" />
                BuyList (lojista)
              </Command.Item>
              <Command.Item
                onSelect={() => navigate("/vendedor/painel/planos")}
                className="rounded-lg px-2 py-2 aria-selected:bg-white/5"
              >
                Planos TCGHub
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[10px] text-luxury-mist">
            <span>
              <kbd className="rounded border border-white/10 px-1">↑↓</kbd> navegar
            </span>
            <span>
              <kbd className="rounded border border-white/10 px-1">↵</kbd> abrir
            </span>
            <span>
              <kbd className="rounded border border-white/10 px-1">Esc</kbd> fechar
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
