"use client";

import { useQuery } from "@tanstack/react-query";

export type PlayerProfile = {
  id?: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  favoriteGame?: string;
  favoriteTcgs?: string[];
  birthDate?: string;
  state?: string;
  location?: { city?: string; country?: string; state?: string; timezone?: string };
  stats?: Array<Record<string, unknown>>;
  rankings?: Array<Record<string, unknown>>;
  achievements?: Array<Record<string, unknown>>;
  recentTournaments?: Array<Record<string, unknown>>;
  privacyLevel?: string;
};

async function fetchProfile(handle: string): Promise<PlayerProfile> {
  const url =
    handle === "me" ? "/api/players/me" : `/api/players/${encodeURIComponent(handle)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Perfil não encontrado");
  return res.json();
}

export function usePlayerProfile(handle: string) {
  return useQuery({
    queryKey: ["player-profile", handle],
    queryFn: () => fetchProfile(handle),
    enabled: Boolean(handle),
  });
}

export function usePlayerHistory(handle: string, page = 1) {
  return useQuery({
    queryKey: ["player-history", handle, page],
    queryFn: async () => {
      const res = await fetch(`/api/players/${encodeURIComponent(handle)}/history?page=${page}`);
      if (!res.ok) throw new Error("Histórico indisponível");
      return res.json();
    },
    enabled: Boolean(handle),
  });
}
