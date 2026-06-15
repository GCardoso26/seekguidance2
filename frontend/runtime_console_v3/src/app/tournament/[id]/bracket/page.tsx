"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BracketTree } from "@/components/tournament/BracketTree";
import { MobileLayout } from "@/components/layout/MobileLayout";

const MOCK_MATCHES = [
  { id: "m1", roundNumber: 1, matchNumber: 1, player1Id: "p1", player2Id: "p2", winnerId: "p1", tableNumber: 1 },
  { id: "m2", roundNumber: 1, matchNumber: 2, player1Id: "p3", player2Id: "p4", winnerId: "p4", tableNumber: 2 },
  { id: "m3", roundNumber: 2, matchNumber: 1, player1Id: "p1", player2Id: "p4", winnerId: null, tableNumber: 1 },
];

const MOCK_NAMES: Record<string, string> = {
  p1: "Jogador A",
  p2: "Jogador B",
  p3: "Jogador C",
  p4: "Jogador D",
};

export default function TournamentBracketPage() {
  const params = useParams();
  const id = String(params.id);

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href={`/tournament/${id}`} className="text-sm text-slate-400">
          ← Torneio
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Chaveamento</h1>
        <p className="mt-1 text-sm text-slate-500">Dados de exemplo — integração com API em breve.</p>
        <div className="mt-6">
          <BracketTree matches={MOCK_MATCHES} nameById={MOCK_NAMES} />
        </div>
      </div>
    </MobileLayout>
  );
}
