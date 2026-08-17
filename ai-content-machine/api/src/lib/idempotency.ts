import { getDb, uid, nowIso } from '../db/client.js'

export function alreadyProcessed(eventId: string): boolean {
  const row = getDb()
    .prepare(`SELECT id FROM automation_events WHERE event_id = ?`)
    .get(eventId) as { id: string } | undefined
  return Boolean(row)
}

export function markProcessed(input: {
  eventId: string
  workflow: string
  executionId?: string
  entityType?: string
  entityId?: string
}): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO automation_events
       (id, event_id, workflow, execution_id, entity_type, entity_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'processed', ?)`,
    )
    .run(
      uid(),
      input.eventId,
      input.workflow,
      input.executionId ?? null,
      input.entityType ?? null,
      input.entityId ?? null,
      nowIso(),
    )
}
