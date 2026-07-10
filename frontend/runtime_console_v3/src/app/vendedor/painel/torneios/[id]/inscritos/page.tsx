"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TournamentRegistrationsManager } from "@/components/seller-dashboard/tournaments/TournamentRegistrationsManager";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useSellerTournaments } from "@/hooks/useSellerTournaments";

const qc = new QueryClient();

function InscritosView() {
  const params = useParams();
  const id = String(params.id);
  const { data } = useSellerTournaments({ page: 1, limit: 100 });
  const tournament = data?.tournaments.find((t) => t.id === id);

  return (
    <>
      <SellerHeader displayName="Inscritos" />
      <div className="space-y-6 p-4 md:p-6" data-testid="tournament-inscritos-page">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/vendedor/painel/torneios" className="text-sm text-muted-foreground hover:text-primary">
              ← Torneios
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-white">
              {tournament?.name ?? "Torneio"}
            </h1>
          </div>
          <Link
            href={`/tournament/${id}`}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary/40"
          >
            Página pública
          </Link>
        </div>
        <TournamentRegistrationsManager tournamentId={id} tournamentName={tournament?.name ?? "Torneio"} />
      </div>
    </>
  );
}

export default function SellerTournamentInscritosPage() {
  return (
    <QueryClientProvider client={qc}>
      <InscritosView />
    </QueryClientProvider>
  );
}
