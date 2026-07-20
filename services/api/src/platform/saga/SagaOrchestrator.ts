import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { createLogger } from "../logging/logger.js";
import { appendDomainEvent } from "../events/DomainEventStore.js";

const log = createLogger("saga");

export type SagaStatus = "running" | "completed" | "compensating" | "compensated" | "failed";
export type SagaStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "compensated"
  | "skipped";

export interface SagaStepDefinition<TContext = Record<string, unknown>> {
  name: string;
  /** Execute forward action. Return output merged into context. */
  execute: (ctx: TContext) => Promise<Record<string, unknown>>;
  /** Optional compensation (undo). */
  compensate?: (ctx: TContext, stepOutput: Record<string, unknown>) => Promise<void>;
  maxAttempts?: number;
  /** If true, failure does not fail the whole saga (best-effort). */
  optional?: boolean;
}

export interface SagaDefinition<TContext = Record<string, unknown>> {
  sagaType: string;
  steps: SagaStepDefinition<TContext>[];
}

export interface StartSagaResult {
  sagaId: string;
  status: SagaStatus;
  context: Record<string, unknown>;
  error?: string;
}

type Q = Pool | PoolClient;

/**
 * Lightweight Saga / Process Manager.
 * Coordinates cross-BC workflows without coupling domains.
 * Persistence: platform.sagas + platform.saga_steps.
 */
export class SagaOrchestrator {
  constructor(private readonly db: Q) {}

  async run<TContext extends Record<string, unknown>>(
    definition: SagaDefinition<TContext>,
    initialContext: TContext,
    opts: { correlationId: string; requestId?: string },
  ): Promise<StartSagaResult> {
    const sagaId = getIdGenerator().generate();
    await this.db.query(
      `
      INSERT INTO platform.sagas (id, saga_type, correlation_id, status, payload, context)
      VALUES ($1,$2,$3,'running',$4::jsonb,$5::jsonb)
      `,
      [
        sagaId,
        definition.sagaType,
        opts.correlationId,
        JSON.stringify(initialContext),
        JSON.stringify(initialContext),
      ],
    );

    for (const [i, step] of definition.steps.entries()) {
      await this.db.query(
        `
        INSERT INTO platform.saga_steps (saga_id, step_name, step_order, max_attempts)
        VALUES ($1,$2,$3,$4)
        `,
        [sagaId, step.name, i, step.maxAttempts ?? 5],
      );
    }

    let context: TContext = { ...initialContext };
    const completed: Array<{ name: string; output: Record<string, unknown> }> = [];

    for (const step of definition.steps) {
      await this.markStep(sagaId, step.name, "running");
      let attempts = 0;
      const maxAttempts = step.maxAttempts ?? 5;
      let lastError: string | undefined;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const output = await step.execute(context);
          context = { ...context, ...output } as TContext;
          completed.push({ name: step.name, output });
          await this.finishStep(sagaId, step.name, "completed", attempts, output);
          await this.db.query(
            `UPDATE platform.sagas SET current_step = $2, context = $3::jsonb, updated_at = now() WHERE id = $1`,
            [sagaId, step.name, JSON.stringify(context)],
          );
          lastError = undefined;
          break;
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
          log.warn(
            { sagaId, step: step.name, attempts, err: lastError },
            "saga_step_retry",
          );
          await this.db.query(
            `UPDATE platform.saga_steps SET attempts = $3, error = $4 WHERE saga_id = $1 AND step_name = $2`,
            [sagaId, step.name, attempts, lastError],
          );
          if (attempts < maxAttempts) {
            await sleep(Math.min(2000 * 2 ** (attempts - 1), 15_000));
          }
        }
      }

      if (lastError) {
        if (step.optional) {
          await this.finishStep(sagaId, step.name, "skipped", attempts, {}, lastError);
          continue;
        }
        await this.finishStep(sagaId, step.name, "failed", attempts, {}, lastError);
        await this.compensate(sagaId, definition, context, completed);
        await this.db.query(
          `UPDATE platform.sagas SET status = 'failed', error = $2, finished_at = now(), updated_at = now() WHERE id = $1`,
          [sagaId, lastError],
        );
        await appendDomainEvent(this.db, {
          eventType: "SagaFailed",
          aggregateType: "saga",
          aggregateId: sagaId,
          payload: { sagaType: definition.sagaType, step: step.name, error: lastError },
          metadata: { requestId: opts.requestId, correlationId: opts.correlationId },
        });
        return { sagaId, status: "failed", context, error: lastError };
      }
    }

    await this.db.query(
      `UPDATE platform.sagas SET status = 'completed', finished_at = now(), updated_at = now(), current_step = $2, context = $3::jsonb WHERE id = $1`,
      [sagaId, definition.steps[definition.steps.length - 1]?.name ?? null, JSON.stringify(context)],
    );
    await appendDomainEvent(this.db, {
      eventType: "SagaCompleted",
      aggregateType: "saga",
      aggregateId: sagaId,
      payload: { sagaType: definition.sagaType },
      metadata: { requestId: opts.requestId, correlationId: opts.correlationId },
    });
    return { sagaId, status: "completed", context };
  }

  private async compensate<TContext extends Record<string, unknown>>(
    sagaId: string,
    definition: SagaDefinition<TContext>,
    context: TContext,
    completed: Array<{ name: string; output: Record<string, unknown> }>,
  ): Promise<void> {
    await this.db.query(
      `UPDATE platform.sagas SET status = 'compensating', updated_at = now() WHERE id = $1`,
      [sagaId],
    );
    for (const done of [...completed].reverse()) {
      const def = definition.steps.find((s) => s.name === done.name);
      if (!def?.compensate) continue;
      try {
        await def.compensate(context, done.output);
        await this.db.query(
          `UPDATE platform.saga_steps SET status = 'compensated', finished_at = now() WHERE saga_id = $1 AND step_name = $2`,
          [sagaId, done.name],
        );
      } catch (e) {
        log.error(
          { sagaId, step: done.name, err: e instanceof Error ? e.message : String(e) },
          "saga_compensate_failed",
        );
      }
    }
    await this.db.query(
      `UPDATE platform.sagas SET status = 'compensated', updated_at = now() WHERE id = $1`,
      [sagaId],
    );
  }

  private async markStep(sagaId: string, stepName: string, status: SagaStepStatus): Promise<void> {
    await this.db.query(
      `UPDATE platform.saga_steps SET status = $3, started_at = coalesce(started_at, now()) WHERE saga_id = $1 AND step_name = $2`,
      [sagaId, stepName, status],
    );
  }

  private async finishStep(
    sagaId: string,
    stepName: string,
    status: SagaStepStatus,
    attempts: number,
    output: Record<string, unknown>,
    error?: string,
  ): Promise<void> {
    await this.db.query(
      `
      UPDATE platform.saga_steps
      SET status = $3, attempts = $4, output = $5::jsonb, error = $6, finished_at = now()
      WHERE saga_id = $1 AND step_name = $2
      `,
      [sagaId, stepName, status, attempts, JSON.stringify(output), error ?? null],
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function createSagaOrchestrator(db: Pool | PoolClient): SagaOrchestrator {
  return new SagaOrchestrator(db);
}
