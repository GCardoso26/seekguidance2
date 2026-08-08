#!/usr/bin/env node
/**
 * Import workflows into n8n via REST API.
 * Requires: N8N_BASE_URL, N8N_API_KEY
 */
import fs from 'node:fs'
import path from 'node:path'

const base = process.env.N8N_BASE_URL
const key = process.env.N8N_API_KEY
if (!base || !key) {
  console.error('Missing N8N_BASE_URL or N8N_API_KEY — dry-run only')
}

const dir = path.resolve('n8n/workflows')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))

for (const file of files) {
  const workflow = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
  if (!base || !key) {
    console.log(`[dry-run] would import ${file} (${workflow.name})`)
    continue
  }
  const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': key,
    },
    body: JSON.stringify({
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings ?? {},
    }),
  })
  if (!res.ok) {
    console.error(`FAIL import ${file}: ${res.status} ${await res.text()}`)
    process.exitCode = 1
  } else {
    console.log(`Imported ${file}`)
  }
}
