import { getDb, uid, nowIso } from '../db/client.js'
import type { Reality } from '../config.js'

export function recordAiCost(input: {
  workspaceId: string
  operation: string
  provider: string
  model: string
  inputTokens?: number
  outputTokens?: number
  estimatedCostCents?: number
  contentIdeaId?: string
  scriptRunId?: string
  researchRunId?: string
  productionRunId?: string
  reality?: Reality
}): string {
  const id = uid()
  getDb()
    .prepare(
      `INSERT INTO ai_cost_events
       (id, workspace_id, operation, provider, model, input_tokens, output_tokens,
        estimated_cost_cents, content_idea_id, script_run_id, research_run_id, production_run_id, reality, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.workspaceId,
      input.operation,
      input.provider,
      input.model,
      input.inputTokens ?? 0,
      input.outputTokens ?? 0,
      input.estimatedCostCents ?? 0,
      input.contentIdeaId ?? null,
      input.scriptRunId ?? null,
      input.researchRunId ?? null,
      input.productionRunId ?? null,
      input.reality ?? 'MOCK',
      nowIso(),
    )
  return id
}

export function sumAiCost(workspaceId: string): number {
  const row = getDb()
    .prepare(`SELECT COALESCE(SUM(estimated_cost_cents),0) as c FROM ai_cost_events WHERE workspace_id = ?`)
    .get(workspaceId) as { c: number }
  return row.c
}
