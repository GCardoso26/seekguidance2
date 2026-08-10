import { z } from "zod";
import { GAME_TOKENS, PRODUCT_GAME_IDS } from "@/lib/tcg-tokens";
import type { SellerTournamentPairingFormat, SellerTournamentRow } from "@/types/seller-tournament";

export const PAIRING_FORMATS = [
  { value: "swiss", label: "Suíço" },
  { value: "single_elimination", label: "Eliminação simples" },
  { value: "double_elimination", label: "Eliminação dupla" },
  { value: "round_robin", label: "Round robin" },
] as const;

/** ADR-016: allowlist viva (sem SWU). Alinhado a GAME_TOKENS / catálogo. */
export const TOURNAMENT_GAME_OPTIONS = PRODUCT_GAME_IDS.map((id) => ({
  id,
  name: GAME_TOKENS[id].name,
})) as ReadonlyArray<{ id: string; name: string }>;

const sellerTournamentFormBase = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres"),
  pairing_format: z.enum(["swiss", "single_elimination", "double_elimination", "round_robin"]),
  game_id: z.string().min(1, "Selecione o jogo"),
  format_code: z.string().min(1, "Selecione o formato de jogo"),
  date: z
    .string({ required_error: "Data é obrigatória" })
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Data inválida")
    .refine((v) => new Date(v).getTime() > Date.now(), "A data deve ser no futuro"),
  entry_fee: z.coerce.number().min(0, "Taxa não pode ser negativa"),
  max_players: z.union([z.coerce.number().int().min(2), z.literal("")]).optional(),
  description: z.string().max(1000, "Máximo 1000 caracteres").optional().or(z.literal("")),
  prizes: z.string().max(500).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
});

export const sellerTournamentFormSchema = sellerTournamentFormBase;

export type SellerTournamentFormValues = z.infer<typeof sellerTournamentFormBase>;

export function parseSellerTournamentForm(data: unknown) {
  return sellerTournamentFormSchema.safeParse(data);
}

export function tournamentFormToApiPayload(values: SellerTournamentFormValues) {
  const maxPlayers =
    values.max_players === "" || values.max_players === undefined ? 128 : values.max_players;

  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    game_code: values.game_id,
    format_code: values.format_code,
    max_players: maxPlayers,
    starts_at: new Date(values.date).toISOString(),
    match_type: values.pairing_format === "single_elimination" ? "BO1" : "BO3",
    timer_minutes: 50,
    level: "regular",
  };

  if (values.pairing_format === "single_elimination") {
    payload.top_cut = 8;
  } else if (values.pairing_format === "swiss") {
    payload.swiss_rounds = "auto";
  }

  return payload;
}

export function tournamentFromApiRow(row: SellerTournamentRow): SellerTournamentFormValues {
  return {
    name: row.name,
    pairing_format: row.pairingFormat,
    game_id: row.gameCode,
    format_code: row.formatCode,
    date: row.startsAt ? new Date(row.startsAt).toISOString().slice(0, 16) : "",
    entry_fee: row.entryFeeCents / 100,
    max_players: row.maxPlayers ?? "",
    description: row.description ?? "",
    prizes: row.prizes ?? "",
    location: row.location ?? "",
  };
}

export function pairingFormatLabel(value: SellerTournamentPairingFormat): string {
  return PAIRING_FORMATS.find((p) => p.value === value)?.label ?? value;
}
