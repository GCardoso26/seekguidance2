"use client";

import { useQuery } from "@tanstack/react-query";
import type { SellerTournamentsListResponse } from "@/lib/seller-tournaments-bff";

type ListOptions = {
  page?: number;
  limit?: number;
  status?: string;
  game?: string;
  format?: string;
  enabled?: boolean;
};

function buildQueryString(page: number, limit: number, status?: string, game?: string, format?: string) {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) qs.set("status", status);
  if (game) qs.set("game", game);
  if (format) qs.set("format", format);
  return qs.toString();
}

async function fetchSellerTournaments(
  page: number,
  limit: number,
  status?: string,
  game?: string,
  format?: string,
): Promise<SellerTournamentsListResponse> {
  const qs = buildQueryString(page, limit, status, game, format);
  const res = await fetch(`/api/tournament/tournaments/mine?${qs}`);
  if (res.status === 401) throw new Error("login_required");
  if (res.status === 403) throw new Error("plan_forbidden");
  if (!res.ok) throw new Error("fetch_failed");
  return res.json() as Promise<SellerTournamentsListResponse>;
}

export function useSellerTournaments({
  page = 1,
  limit = 20,
  status = "",
  game = "",
  format = "",
  enabled = true,
}: ListOptions) {
  const statusNorm = status.trim();
  const gameNorm = game.trim();
  const formatNorm = format.trim();

  return useQuery({
    queryKey: ["seller-tournaments", page, limit, statusNorm || "all", gameNorm || "all", formatNorm || "all"],
    queryFn: () =>
      fetchSellerTournaments(
        page,
        limit,
        statusNorm || undefined,
        gameNorm || undefined,
        formatNorm || undefined,
      ),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}
