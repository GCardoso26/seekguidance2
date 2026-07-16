import { requirePostgresClient } from "../../platform/transaction/types.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { CatalogCardRepository } from "../domain/CatalogCardRepository.js";
import type { CatalogCard, CatalogCardUpsert } from "../domain/models.js";

/**
 * Postgres adapter — uses only the client from TxContext (never opens its own connection).
 */
export class PostgresCatalogCardRepository implements CatalogCardRepository {
  async upsert(tx: TxContext, input: CatalogCardUpsert): Promise<RepositoryResult<CatalogCard>> {
    const client = requirePostgresClient(tx);
    const existing = input.id
      ? await this.findById(tx, input.id)
      : null;

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:card:${existing.id}`);
    }

    const id = existing?.id ?? input.id ?? getIdGenerator().generate();
    const candidate: Omit<CatalogCard, "createdAt" | "updatedAt" | "rowVersion"> & {
      rowVersion: number;
    } = {
      id,
      gameId: input.gameId,
      setId: input.setId ?? null,
      name: input.name,
      normalizedName: input.normalizedName,
      cardNumber: input.cardNumber ?? null,
      rarity: input.rarity ?? null,
      language: input.language ?? "en",
      oracleText: input.oracleText || null,
      typeLine: input.typeLine ?? null,
      artist: input.artist ?? null,
      gameData: input.gameData ?? {},
      rowVersion: existing ? existing.rowVersion + 1 : 1,
    };

    if (existing && sameCardContent(existing, { ...existing, ...candidate })) {
      return {
        outcome: "unchanged",
        entity: existing,
        previousVersion: existing.rowVersion,
        currentVersion: existing.rowVersion,
      };
    }

    const res = await client.query(
      `
      INSERT INTO catalog.catalog_cards (
        id, game_id, set_id, name, normalized_name, card_number, rarity,
        language, oracle_text, type_line, artist, game_data, row_version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13)
      ON CONFLICT (id) DO UPDATE SET
        game_id = EXCLUDED.game_id,
        set_id = EXCLUDED.set_id,
        name = EXCLUDED.name,
        normalized_name = EXCLUDED.normalized_name,
        card_number = EXCLUDED.card_number,
        rarity = EXCLUDED.rarity,
        language = EXCLUDED.language,
        oracle_text = EXCLUDED.oracle_text,
        type_line = EXCLUDED.type_line,
        artist = EXCLUDED.artist,
        game_data = EXCLUDED.game_data,
        row_version = catalog.catalog_cards.row_version + 1,
        updated_at = now()
      RETURNING *
      `,
      [
        id,
        input.gameId,
        input.setId ?? null,
        input.name,
        input.normalizedName,
        input.cardNumber ?? null,
        input.rarity ?? null,
        input.language ?? "en",
        input.oracleText || null,
        input.typeLine ?? null,
        input.artist ?? null,
        JSON.stringify(input.gameData ?? {}),
        existing ? existing.rowVersion + 1 : 1,
      ],
    );
    const entity = mapCard(res.rows[0]);
    return {
      outcome: existing ? "updated" : "created",
      entity,
      previousVersion: existing?.rowVersion ?? null,
      currentVersion: entity.rowVersion,
    };
  }

  async findById(tx: TxContext, id: string): Promise<CatalogCard | null> {
    const client = requirePostgresClient(tx);
    const res = await client.query(`SELECT * FROM catalog.catalog_cards WHERE id = $1`, [id]);
    return res.rows[0] ? mapCard(res.rows[0]) : null;
  }

  async findByGameAndNormalizedName(
    tx: TxContext,
    gameId: string,
    normalizedName: string,
  ): Promise<CatalogCard[]> {
    const client = requirePostgresClient(tx);
    const res = await client.query(
      `SELECT * FROM catalog.catalog_cards WHERE game_id = $1 AND normalized_name = $2`,
      [gameId, normalizedName],
    );
    return res.rows.map(mapCard);
  }
}

function sameCardContent(a: CatalogCard, b: CatalogCard): boolean {
  return (
    a.gameId === b.gameId &&
    (a.setId ?? null) === (b.setId ?? null) &&
    a.name === b.name &&
    a.normalizedName === b.normalizedName &&
    (a.cardNumber ?? null) === (b.cardNumber ?? null) &&
    (a.rarity ?? null) === (b.rarity ?? null) &&
    a.language === b.language &&
    (a.oracleText || null) === (b.oracleText || null) &&
    (a.typeLine ?? null) === (b.typeLine ?? null) &&
    (a.artist ?? null) === (b.artist ?? null) &&
    stableJson(a.gameData) === stableJson(b.gameData)
  );
}

function stableJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) out[k] = sortKeys(obj[k]);
    return out;
  }
  return value;
}

function mapCard(row: Record<string, unknown>): CatalogCard {
  const gameData =
    typeof row.game_data === "string"
      ? (JSON.parse(row.game_data) as Record<string, unknown>)
      : ((row.game_data as Record<string, unknown>) ?? {});
  return {
    id: String(row.id),
    gameId: String(row.game_id),
    setId: row.set_id ? String(row.set_id) : null,
    name: String(row.name),
    normalizedName: String(row.normalized_name),
    cardNumber: row.card_number ? String(row.card_number) : null,
    rarity: row.rarity ? String(row.rarity) : null,
    language: String(row.language ?? "en"),
    oracleText: row.oracle_text ? String(row.oracle_text) : null,
    typeLine: row.type_line ? String(row.type_line) : null,
    artist: row.artist ? String(row.artist) : null,
    gameData,
    rowVersion: Number(row.row_version ?? 1),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}
