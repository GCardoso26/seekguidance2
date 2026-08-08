import { getDb, uid, nowIso } from '../db/client.js'
import type { Reality } from '../config.js'

export function emitEvent(input: {
  workspaceId?: string
  eventType: string
  entityType?: string
  entityId?: string
  payload?: Record<string, unknown>
  reality?: Reality
}): string {
  const id = uid()
  getDb()
    .prepare(
      `INSERT INTO domain_events
       (id, workspace_id, event_type, entity_type, entity_id, payload, reality, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.workspaceId ?? null,
      input.eventType,
      input.entityType ?? null,
      input.entityId ?? null,
      JSON.stringify(input.payload ?? {}),
      input.reality ?? 'MOCK',
      nowIso(),
    )
  return id
}

export function listEvents(workspaceId: string, limit = 100) {
  return getDb()
    .prepare(
      `SELECT * FROM domain_events WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(workspaceId, limit)
}
