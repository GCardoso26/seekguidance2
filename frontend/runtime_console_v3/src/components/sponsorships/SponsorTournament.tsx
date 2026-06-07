"use client";

import { useState } from "react";

type Props = { tournamentId: string; participantCount?: number };

export function SponsorTournament({ tournamentId, participantCount = 0 }: Props) {
  const [loading, setLoading] = useState(false);

  const tiers = [
    { id: "small", label: "R$ 50", desc: "Logo pequeno" },
    { id: "medium", label: "R$ 150", desc: "Logo médio + anúncio" },
    { id: "large", label: "R$ 500", desc: "Logo grande + prêmios" },
  ];

  const sponsor = async (tier: string) => {
    setLoading(true);
    try {
      await fetch(`/api/tournaments/${tournamentId}/sponsor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-gradient-to-r from-purple-700 to-pink-700 p-6 text-white">
      <h3 className="text-xl font-bold">Patrocine este torneio</h3>
      <p className="mb-4 opacity-90">Sua marca em destaque para {participantCount} jogadores.</p>
      <div className="mb-4 grid grid-cols-3 gap-3">
        {tiers.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={loading}
            onClick={() => sponsor(t.id)}
            className="rounded-lg bg-white/15 p-3 text-center hover:bg-white/25"
          >
            <div className="text-lg font-bold">{t.label}</div>
            <div className="text-xs opacity-75">{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
