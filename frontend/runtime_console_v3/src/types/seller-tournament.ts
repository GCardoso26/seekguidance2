export type SellerTournamentStatus =
  | "draft"
  | "open"
  | "registration_open"
  | "check_in"
  | "in_progress"
  | "finalized"
  | "completed"
  | "cancelled"
  | string;

export type SellerTournamentPairingFormat =
  | "swiss"
  | "single_elimination"
  | "double_elimination"
  | "round_robin";

export type SellerTournamentRow = {
  id: string;
  name: string;
  gameCode: string;
  gameName: string;
  formatCode: string;
  formatLabel: string;
  pairingFormat: SellerTournamentPairingFormat;
  status: SellerTournamentStatus;
  statusLabel: string;
  maxPlayers: number | null;
  entryFeeCents: number;
  startsAt: string | null;
  description: string | null;
  prizes: string | null;
  location: string | null;
  createdAt: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  open: "Aberto",
  published: "Publicado",
  registration_open: "Inscrições abertas",
  check_in: "Check-in",
  in_progress: "Em andamento",
  between_rounds: "Entre rodadas",
  swiss_complete: "Suíço concluído",
  bracket_active: "Chave ativa",
  finalized: "Finalizado",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

const GAME_NAMES: Record<string, string> = {
  MTG: "Magic: The Gathering",
  POKEMON: "Pokémon TCG",
  LORCANA: "Disney Lorcana",
  SWU: "Star Wars Unlimited",
};

export function tournamentStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function tournamentGameName(code: string): string {
  return GAME_NAMES[code.toUpperCase()] ?? code;
}

export function normalizeSellerTournament(row: Record<string, unknown>): SellerTournamentRow {
  const gameCode = String(row.game_code ?? row.gameCode ?? row.tcg ?? "MTG").toUpperCase();
  const formatCode = String(row.format_code ?? row.formatCode ?? row.format ?? "STANDARD");
  const pairing = String(row.pairing_format ?? row.pairingFormat ?? "swiss") as SellerTournamentPairingFormat;
  const status = String(row.status ?? "draft");

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    gameCode,
    gameName: tournamentGameName(gameCode),
    formatCode,
    formatLabel: formatCode,
    pairingFormat: ["swiss", "single_elimination", "double_elimination", "round_robin"].includes(pairing)
      ? pairing
      : "swiss",
    status,
    statusLabel: tournamentStatusLabel(status),
    maxPlayers: row.max_players == null ? null : Number(row.max_players),
    entryFeeCents: Number(row.entry_fee_cents ?? row.entryFeeCents ?? 0),
    startsAt: row.starts_at ? String(row.starts_at) : null,
    description: row.description ? String(row.description) : null,
    prizes: row.prizes ? String(row.prizes) : null,
    location: row.location ? String(row.location) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  };
}
