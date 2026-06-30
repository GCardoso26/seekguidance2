"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { pairingFormatLabel } from "@/lib/seller-tournament-form";
import type { SellerTournamentRow } from "@/types/seller-tournament";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "./TournamentStatusBadge";

type Props = {
  tournament: SellerTournamentRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

export function TournamentDetailsModal({ tournament, open, onOpenChange }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100vw-2rem,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-white/10 bg-luxury-onyx p-6 shadow-xl"
          data-testid="tournament-details-modal"
        >
          <Dialog.Title className="text-lg font-semibold text-white">{tournament.name}</Dialog.Title>
          <div className="mt-4 space-y-3 text-sm text-luxury-mist">
            <p>
              <span className="text-luxury-frost">Status:</span>{" "}
              <TournamentStatusBadge status={tournament.status} label={tournament.statusLabel} />
            </p>
            <p>
              <span className="text-luxury-frost">Jogo:</span> {tournament.gameName}
            </p>
            <p>
              <span className="text-luxury-frost">Formato:</span>{" "}
              {pairingFormatLabel(tournament.pairingFormat)} ({tournament.formatCode})
            </p>
            <p>
              <span className="text-luxury-frost">Data:</span> {formatDate(tournament.startsAt)}
            </p>
            {tournament.location && (
              <p>
                <span className="text-luxury-frost">Local:</span> {tournament.location}
              </p>
            )}
            {tournament.description && (
              <p>
                <span className="text-luxury-frost">Descrição:</span> {tournament.description}
              </p>
            )}
            {tournament.prizes && (
              <p>
                <span className="text-luxury-frost">Prêmios:</span> {tournament.prizes}
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/tournament/${tournament.id}`}>Página pública</Link>
            </Button>
            <Button type="button" asChild>
              <Link href={`/tournament/${tournament.id}/play`}>Gerenciar torneio</Link>
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
