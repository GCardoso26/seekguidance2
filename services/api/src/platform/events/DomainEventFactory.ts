import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { getClock } from "../../shared/time/Clock.js";
import type { CreatePlatformEventInput, PlatformDomainEvent } from "./DomainEvent.js";
import { eventRegistry } from "./EventRegistry.js";
import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventName,
} from "../../shared/events/types.js";

function parseVersionFromType(eventType: string, explicit?: number): number {
  if (explicit != null) return explicit;
  const m = eventType.match(/\.v(\d+)$/);
  return m ? Number(m[1]) : 1;
}

/**
 * ADR-008 — sole canonical factory for new Domain Events.
 */
export class DomainEventFactory {
  create<T>(input: CreatePlatformEventInput<T>): PlatformDomainEvent<T> {
    const version = parseVersionFromType(input.eventType, input.version);
    const eventType = input.eventType.includes(".v")
      ? input.eventType
      : `${input.eventType}.v${version}`;

    if (!eventRegistry.isRegistered(eventType, version)) {
      throw new Error(`unregistered_event:${eventType}:v${version}`);
    }

    const correlationId = input.correlationId ?? getIdGenerator().generate();
    return {
      eventId: input.eventId ?? getIdGenerator().generate(),
      eventType,
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      version,
      occurredAt: input.occurredAt ?? new Date(getClock().nowIso()),
      correlationId,
      causationId: input.causationId,
      actor: input.actor,
      tenantId: input.tenantId,
      payload: input.payload,
    };
  }

  /** Bridge → legacy envelope used by existing Outbox / Application Services. */
  toLegacy<T extends Record<string, unknown>>(
    event: PlatformDomainEvent<T>,
  ): DomainEvent<T> {
    const baseType = event.eventType.replace(/\.v\d+$/, "") as DomainEventName;
    return createDomainEvent(baseType, event.aggregateId, event.payload, {
      id: event.eventId,
      aggregateType: event.aggregateType,
      correlationId: event.correlationId,
      causationId: event.causationId,
      eventVersion: event.version,
      occurredAt: event.occurredAt.toISOString(),
      requestId: event.correlationId,
      producer: event.actor,
    });
  }

  fromLegacy<T extends Record<string, unknown>>(
    legacy: DomainEvent<T>,
  ): PlatformDomainEvent<T> {
    const version = legacy.metadata.eventVersion ?? 1;
    return {
      eventId: legacy.id ?? getIdGenerator().generate(),
      eventType: `${legacy.eventType}.v${version}`,
      aggregateId: legacy.aggregateId,
      aggregateType: legacy.aggregateType,
      version,
      occurredAt: new Date(legacy.metadata.occurredAt),
      correlationId: legacy.metadata.correlationId,
      causationId: legacy.metadata.causationId,
      actor: legacy.metadata.producer,
      payload: legacy.payload,
    };
  }
}

export const domainEventFactory = new DomainEventFactory();
