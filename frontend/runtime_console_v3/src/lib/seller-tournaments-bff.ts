import { buildSellerTournamentsMock } from "@/lib/seller-tournaments-mock";
import { normalizeSellerTournament, type SellerTournamentRow } from "@/types/seller-tournament";

export type SellerTournamentsListParams = {
  page?: number;
  limit?: number;
  status?: string;
  game?: string;
  format?: string;
};

export type SellerTournamentsListResponse = {
  tournaments: SellerTournamentRow[];
  total: number;
  page: number;
  limit: number;
};

function filterTournaments(
  list: SellerTournamentRow[],
  status?: string,
  game?: string,
  format?: string,
): SellerTournamentRow[] {
  let out = list;
  if (status?.trim()) {
    out = out.filter((t) => t.status === status);
  }
  if (game?.trim()) {
    out = out.filter((t) => t.gameCode.toUpperCase() === game.toUpperCase());
  }
  if (format?.trim()) {
    out = out.filter((t) => t.pairingFormat === format);
  }
  return out;
}

export function paginateTournaments(
  tournaments: SellerTournamentRow[],
  page = 1,
  limit = 20,
): SellerTournamentsListResponse {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const start = (safePage - 1) * safeLimit;
  const slice = tournaments.slice(start, start + safeLimit);
  return {
    tournaments: slice,
    total: tournaments.length,
    page: safePage,
    limit: safeLimit,
  };
}

export function listTournamentsFromApiRows(
  rows: Array<Record<string, unknown>>,
  params: SellerTournamentsListParams,
): SellerTournamentsListResponse {
  const normalized = rows.map((r) => normalizeSellerTournament(r));
  const filtered = filterTournaments(
    normalized,
    params.status,
    params.game,
    params.format,
  );
  return paginateTournaments(filtered, params.page, params.limit);
}

export function listTournamentsMock(params: SellerTournamentsListParams): SellerTournamentsListResponse {
  const all = buildSellerTournamentsMock();
  const filtered = filterTournaments(all, params.status, params.game, params.format);
  return paginateTournaments(filtered, params.page, params.limit);
}
