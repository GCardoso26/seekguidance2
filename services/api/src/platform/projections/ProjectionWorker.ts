import type { PlatformDomainEvent } from "../events/DomainEvent.js";
import { createLogger } from "../logging/logger.js";

const log = createLogger("projection");

/**
 * Single projection consumer contract — ADR Projection Service.
 * BullMQ only dispatches; logic lives here.
 */
export interface ProjectionConsumer {
  readonly name: string;
  supports(event: PlatformDomainEvent): boolean;
  project(event: PlatformDomainEvent): Promise<void>;
}

export class ProjectionWorker {
  constructor(private readonly consumers: ProjectionConsumer[]) {}

  async handle(event: PlatformDomainEvent): Promise<{ projected: string[] }> {
    const projected: string[] = [];
    for (const c of this.consumers) {
      if (!c.supports(event)) continue;
      try {
        await c.project(event);
        projected.push(c.name);
      } catch (e) {
        log.error(
          { consumer: c.name, eventType: event.eventType, err: String(e) },
          "projection_failed",
        );
        throw e;
      }
    }
    return { projected };
  }

  register(consumer: ProjectionConsumer): void {
    this.consumers.push(consumer);
  }
}

export function createProjectionWorker(consumers: ProjectionConsumer[] = []): ProjectionWorker {
  return new ProjectionWorker([...consumers]);
}
