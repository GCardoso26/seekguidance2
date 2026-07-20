import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";

type Q = Pool | PoolClient;

export type IdempotencyStatus = "processing" | "completed" | "failed";

export interface IdempotencyRecord {
  commandName: string;
  idempotencyKey: string;
  status: IdempotencyStatus;
  responseBody?: unknown;
  error?: string;
}

export class PostgresIdempotencyStore {
  constructor(private readonly db: Q) {}

  async get(commandName: string, key: string): Promise<IdempotencyRecord | null> {
    const res = await this.db.query(
      `SELECT command_name, idempotency_key, status, response_body, error
       FROM platform.idempotency_keys
       WHERE command_name = $1 AND idempotency_key = $2`,
      [commandName, key],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      commandName: row.command_name,
      idempotencyKey: row.idempotency_key,
      status: row.status,
      responseBody: row.response_body,
      error: row.error ?? undefined,
    };
  }

  async begin(commandName: string, key: string, requestHash?: string): Promise<"new" | "exists"> {
    const res = await this.db.query(
      `
      INSERT INTO platform.idempotency_keys (command_name, idempotency_key, status, request_hash)
      VALUES ($1,$2,'processing',$3)
      ON CONFLICT (command_name, idempotency_key) DO NOTHING
      RETURNING id
      `,
      [commandName, key, requestHash ?? null],
    );
    return (res.rowCount ?? 0) > 0 ? "new" : "exists";
  }

  async complete(commandName: string, key: string, response: unknown): Promise<void> {
    const hash = createHash("sha256").update(JSON.stringify(response)).digest("hex");
    await this.db.query(
      `
      UPDATE platform.idempotency_keys
      SET status = 'completed', response_body = $3::jsonb, response_hash = $4, updated_at = now()
      WHERE command_name = $1 AND idempotency_key = $2
      `,
      [commandName, key, JSON.stringify(response), hash],
    );
  }

  async fail(commandName: string, key: string, error: string): Promise<void> {
    await this.db.query(
      `
      UPDATE platform.idempotency_keys
      SET status = 'failed', error = $3, updated_at = now()
      WHERE command_name = $1 AND idempotency_key = $2
      `,
      [commandName, key, error],
    );
  }
}

export interface IdempotentCommand<TInput, TResult> {
  name: string;
  execute: (input: TInput) => Promise<TResult>;
}

/**
 * ADR-009 — wraps any command with idempotency key.
 */
export class IdempotentCommandHandler {
  constructor(private readonly store: PostgresIdempotencyStore) {}

  async handle<TInput, TResult>(
    command: IdempotentCommand<TInput, TResult>,
    input: TInput,
    idempotencyKey: string,
  ): Promise<TResult> {
    const existing = await this.store.get(command.name, idempotencyKey);
    if (existing?.status === "completed") {
      return existing.responseBody as TResult;
    }
    if (existing?.status === "processing") {
      throw new Error(`idempotency_in_progress:${command.name}`);
    }

    const began = await this.store.begin(command.name, idempotencyKey);
    if (began === "exists") {
      const again = await this.store.get(command.name, idempotencyKey);
      if (again?.status === "completed") return again.responseBody as TResult;
      throw new Error(`idempotency_conflict:${command.name}`);
    }

    try {
      const result = await command.execute(input);
      await this.store.complete(command.name, idempotencyKey, result);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await this.store.fail(command.name, idempotencyKey, msg);
      throw e;
    }
  }
}

export function createIdempotentHandler(db: Pool | PoolClient): IdempotentCommandHandler {
  return new IdempotentCommandHandler(new PostgresIdempotencyStore(db));
}
