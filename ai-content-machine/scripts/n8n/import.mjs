#!/usr/bin/env node
/**
 * Import/upsert workflows into n8n via REST API.
 * Requires: N8N_BASE_URL, N8N_API_KEY
 *
 * Matches existing workflows by name and PATCHes them (avoids duplicate
 * cron copies still sending workspaceId:"").
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

async function listWorkflows() {
  const res = await fetch(`${root}/api/v1/workflows?limit=250`, { headers })
  if (!res.ok) throw new Error(`list failed: ${res.status} ${await res.text()}`)
  const json = await res.json()
  return Array.isArray(json) ? json : json.data || []
}

const dir = path.resolve('n8n/workflows')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))

let existingByName = new Map()
if (base && key) {
  try {
    const existing = await listWorkflows()
    existingByName = new Map(existing.map((w) => [w.name, w]))
  } catch (err) {
    console.error('WARN: could not list existing workflows', err instanceof Error ? err.message : err)
  }
}

for (const file of files) {
  const workflow = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  const payload = {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings ?? {},
  }

  if (!base || !key) {
    console.log(`[dry-run] would upsert ${file} (${workflow.name})`)
    continue
  }

  const found = existingByName.get(workflow.name)
  if (found?.id) {
    const res = await fetch(`${root}/api/v1/workflows/${found.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        ...payload,
        active: found.active === true,
      }),
    })
    if (!res.ok) {
      console.error(`FAIL update ${file}: ${res.status} ${await res.text()}`)
      process.exitCode = 1
    } else {
      console.log(`Updated ${file} → id=${found.id} active=${found.active === true}`)
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
