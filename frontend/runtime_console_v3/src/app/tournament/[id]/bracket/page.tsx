"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TournamentBracketPanel } from "@/components/tournament/TournamentBracketPanel";
import { useParams } from "next/navigation";

const qc = new QueryClient();

function BracketView() {
  const params = useParams();
  const id = String(params.id);

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <TournamentBracketPanel
          tournamentId={id}
          backHref={`/tournament/${id}`}
          showSellerLink
        />
      </div>
    </MobileLayout>
  );
}

export default function TournamentBracketPage() {
  return (
    <QueryClientProvider client={qc}>
      <BracketView />
    </QueryClientProvider>
  );
}
