#!/usr/bin/env node
/**
 * Import/upsert workflows into n8n via REST API.
 * Requires: N8N_BASE_URL, N8N_API_KEY
 *
 * Matches existing workflows by name and PUTs them (n8n 1.72 has no PATCH).
 * Sanitizes `settings` to keys accepted by the public API schema.
 */
import fs from 'node:fs'
import path from 'node:path'

const base = process.env.N8N_BASE_URL
const key = process.env.N8N_API_KEY
if (!base || !key) {
  console.error('Missing N8N_BASE_URL or N8N_API_KEY — dry-run only')
}

const root = (base || '').replace(/\/$/, '')
const headers = {
  'Content-Type': 'application/json',
  'X-N8N-API-KEY': key || '',
}

/** n8n public API rejects unknown settings keys (additionalProperties: false). */
const ALLOWED_SETTINGS = new Set([
  'saveExecutionProgress',
  'saveManualExecutions',
  'saveDataErrorExecution',
  'saveDataSuccessExecution',
  'executionTimeout',
  'errorWorkflow',
  'timezone',
  'executionOrder',
])

function sanitizeSettings(settings) {
  const src = settings && typeof settings === 'object' ? settings : {}
  const out = {}
  for (const [k, v] of Object.entries(src)) {
    if (ALLOWED_SETTINGS.has(k)) out[k] = v
  }
  if (!out.executionOrder) out.executionOrder = 'v1'
  return out
}

function buildPayload(workflow) {
  return {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: sanitizeSettings(workflow.settings),
  }
}

async function listWorkflows() {
  const res = await fetch(`${root}/api/v1/workflows?limit=250`, { headers })
  if (!res.ok) throw new Error(`list failed: ${res.status} ${await res.text()}`)
  const json = await res.json()
  return Array.isArray(json) ? json : json.data || []
}

const dir = path.resolve('n8n/workflows')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()

let existingByName = new Map()
if (base && key) {
  try {
    const existing = await listWorkflows()
    // If duplicates exist, prefer the most recently updated
    for (const w of existing) {
      const prev = existingByName.get(w.name)
      if (!prev || String(w.updatedAt || '') > String(prev.updatedAt || '')) {
        existingByName.set(w.name, w)
      }
    }
  } catch (err) {
    console.error('WARN: could not list existing workflows', err instanceof Error ? err.message : err)
  }
}

for (const file of files) {
  const workflow = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  const payload = buildPayload(workflow)

  if (!base || !key) {
    console.log(`[dry-run] would upsert ${file} (${workflow.name})`)
    continue
  }

  const found = existingByName.get(workflow.name)
  if (found?.id) {
    const res = await fetch(`${root}/api/v1/workflows/${found.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(`FAIL update ${file}: ${res.status} ${await res.text()}`)
      process.exitCode = 1
    } else {
      console.log(`Updated ${file} → id=${found.id} (active=${found.active === true})`)
      // Re-activate if it was active (PUT can deactivate on some versions)
      if (found.active === true) {
        const act = await fetch(`${root}/api/v1/workflows/${found.id}/activate`, {
          method: 'POST',
          headers,
        })
        if (!act.ok && act.status !== 404) {
          console.warn(`WARN activate ${file}: ${act.status} ${await act.text()}`)
        }
      }
    }
  } else {
    const res = await fetch(`${root}/api/v1/workflows`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(`FAIL import ${file}: ${res.status} ${await res.text()}`)
      process.exitCode = 1
    } else {
      const created = await res.json()
      console.log(`Created ${file} → id=${created.id || '?'}`)
    }
  }
}

if (base && key) {
  // Hint about duplicate names left from older imports
  try {
    const all = await listWorkflows()
    const counts = new Map()
    for (const w of all) counts.set(w.name, (counts.get(w.name) || 0) + 1)
    const dups = [...counts.entries()].filter(([, n]) => n > 1)
    if (dups.length) {
      console.warn('\nDuplicate workflow names in n8n (deactivate/delete extras in UI):')
      for (const [name, n] of dups) console.warn(`  ${n}× ${name}`)
    }
  } catch {
    /* ignore */
  }
}
