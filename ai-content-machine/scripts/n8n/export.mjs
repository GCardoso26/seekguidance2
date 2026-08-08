#!/usr/bin/env node
/**
 * Export workflows from n8n REST API into n8n/workflows/
 */
import fs from 'node:fs'
import path from 'node:path'

const base = process.env.N8N_BASE_URL
const key = process.env.N8N_API_KEY
if (!base || !key) {
  console.error('Missing N8N_BASE_URL or N8N_API_KEY')
  process.exit(1)
}

const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/workflows`, {
  headers: { 'X-N8N-API-KEY': key },
})
if (!res.ok) {
  console.error('Failed to list workflows', res.status, await res.text())
  process.exit(1)
}
const data = await res.json()
const outDir = path.resolve('n8n/workflows-export')
fs.mkdirSync(outDir, { recursive: true })
for (const wf of data.data ?? data) {
  const slug = String(wf.name || wf.id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  const file = path.join(outDir, `${slug}.json`)
  fs.writeFileSync(file, JSON.stringify(wf, null, 2))
  console.log('Exported', file)
}
