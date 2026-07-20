/**
 * ADR — CQRS primitives (platform/cqrs).
 * Commands mutate; Queries read projections only.
 */

export interface Command<TPayload = unknown> {
  type: string;
  payload: TPayload;
  idempotencyKey?: string;
  correlationId?: string;
  requestId?: string;
  actor?: string;
}

export interface Query<TParams = unknown> {
  type: string;
  params: TParams;
  correlationId?: string;
  requestId?: string;
}

export interface CommandHandler<TPayload = unknown, TResult = unknown> {
  readonly commandType: string;
  handle(command: Command<TPayload>): Promise<TResult>;
}

export interface QueryHandler<TParams = unknown, TResult = unknown> {
  readonly queryType: string;
  handle(query: Query<TParams>): Promise<TResult>;
}

export class CommandBus {
  private readonly handlers = new Map<string, CommandHandler>();

  register(handler: CommandHandler): void {
    this.handlers.set(handler.commandType, handler);
  }

  async dispatch<TPayload, TResult>(command: Command<TPayload>): Promise<TResult> {
    const h = this.handlers.get(command.type);
    if (!h) throw new Error(`command_handler_missing:${command.type}`);
    return h.handle(command as Command) as Promise<TResult>;
  }
}

export class QueryBus {
  private readonly handlers = new Map<string, QueryHandler>();

  register(handler: QueryHandler): void {
    this.handlers.set(handler.queryType, handler);
  }

  async ask<TParams, TResult>(query: Query<TParams>): Promise<TResult> {
    const h = this.handlers.get(query.type);
    if (!h) throw new Error(`query_handler_missing:${query.type}`);
    return h.handle(query as Query) as Promise<TResult>;
  }
}

/**
 * Pipeline documentation (runtime is composition of handlers):
 * Command → Handler → Saga → Domain Event → Outbox → Projection → Materialized View → Query
 */
export const CQRS_PIPELINE = [
  "Command",
  "Handler",
  "Saga",
  "DomainEvent",
  "Outbox",
  "Projection",
  "MaterializedView",
  "Query",
] as const;
