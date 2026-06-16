"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export type CreateProfileData = {
  handle: string;
  display_name: string;
  bio?: string;
  favorite_game?: string;
  city?: string;
  country?: string;
};

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateProfileData) => {
      const res = await fetch("/api/players/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail ?? "Não foi possível criar o perfil");
      }
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["player-profile", "me"] });
    },
  });
}

export function suggestHandleFromEmail(email: string): string {
  const local = (email.split("@")[0] ?? "jogador").replace(/[^a-zA-Z0-9_]/g, "_");
  const trimmed = local.replace(/^_+|_+$/g, "").slice(0, 30);
  if (trimmed.length >= 3) return trimmed.toLowerCase();
  return `jogador_${trimmed || "tcg"}`.slice(0, 30).toLowerCase();
}
