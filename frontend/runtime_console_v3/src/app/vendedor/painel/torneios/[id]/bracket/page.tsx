"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TournamentBracketPanel } from "@/components/tournament/TournamentBracketPanel";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import { useSellerTournaments } from "@/hooks/useSellerTournaments";

const qc = new QueryClient();

function SellerBracketView() {
  const params = useParams();
  const id = String(params.id);
  const { data } = useSellerTournaments({ page: 1, limit: 100 });
  const tournament = data?.tournaments.find((t) => t.id === id);

  return (
    <>
      <SellerHeader displayName="Bracket" />
      <div className="space-y-6 p-4 md:p-6" data-testid="seller-bracket-page">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/vendedor/painel/torneios" className="text-sm text-muted-foreground hover:text-primary">
              ← Torneios
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-white">
              {tournament?.name ?? "Torneio"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/vendedor/painel/torneios/${id}/inscritos`}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground"
            >
              Inscritos
            </Link>
            <Link
              href={`/tournament/${id}/bracket`}
              className="rounded-lg border border-primary/40 px-4 py-2 text-sm text-primary"
            >
              Página pública
            </Link>
          </div>
        </div>
        <TournamentBracketPanel tournamentId={id} />
      </div>
    </>
  );
}

export default function SellerTournamentBracketPage() {
  return (
    <QueryClientProvider client={qc}>
      <SellerBracketView />
    </QueryClientProvider>
  );
}
