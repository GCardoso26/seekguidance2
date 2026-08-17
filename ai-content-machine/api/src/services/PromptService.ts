import { getDb } from '../db/client.js'

export function getActivePrompt(name: string): { name: string; version: number; body: string } | null {
  const row = getDb()
    .prepare(
      `SELECT name, version, body FROM prompt_versions
       WHERE name = ? AND active = 1
       ORDER BY version DESC LIMIT 1`,
    )
    .get(name) as { name: string; version: number; body: string } | undefined
  return row ?? null
}
