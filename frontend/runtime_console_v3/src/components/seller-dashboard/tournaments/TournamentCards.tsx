"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { pairingFormatLabel } from "@/lib/seller-tournament-form";
import type { SellerTournamentRow } from "@/types/seller-tournament";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "./TournamentStatusBadge";

type Props = {
  tournaments: SellerTournamentRow[];
  onDetails: (t: SellerTournamentRow) => void;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function formatFee(cents: number) {
  if (cents <= 0) return "Gratuito";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function TournamentCards({ tournaments, onDetails }: Props) {
  return (
    <ul className="space-y-3" data-testid="tournament-cards">
      {tournaments.map((t) => (
        <li key={t.id} className="surface-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">{t.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.gameName} · {pairingFormatLabel(t.pairingFormat)}
              </p>
            </div>
            <TournamentStatusBadge status={t.status} label={t.statusLabel} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(t.startsAt)} · {formatFee(t.entryFeeCents)}
            {t.maxPlayers != null ? ` · até ${t.maxPlayers} jogadores` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onDetails(t)}>
              Detalhes
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={`/tournament/${t.id}/play`}>Gerenciar</Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TournamentEmptyState() {
  return (
    <div
      className="rounded-xl border border-dashed border-border bg-muted/50 p-10 text-center"
      data-testid="tournaments-empty"
    >
      <Trophy className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
      <p className="mt-3 text-muted-foreground">Nenhum torneio criado.</p>
      <p className="mt-1 text-sm text-muted-foreground/70">Organize eventos e atraia jogadores à sua loja.</p>
    </div>
  );
}
