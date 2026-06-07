"use client";

import { useMutation } from "@tanstack/react-query";

export function useTournamentPayment() {
  return useMutation({
    mutationFn: async (tournamentId: string) => {
      const res = await fetch("/api/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournamentId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Falha ao criar pagamento");
      }
      return res.json();
    },
  });
}
