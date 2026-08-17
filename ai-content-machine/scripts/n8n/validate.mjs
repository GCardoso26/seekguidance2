#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('n8n/workflows')
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
let failed = 0

for (const file of files) {
  const full = path.join(dir, file)
  try {
    const json = JSON.parse(fs.readFileSync(full, 'utf8'))
    if (!json.name) throw new Error('missing name')
    if (!Array.isArray(json.nodes) || json.nodes.length === 0) throw new Error('missing nodes')
    if (!json.connections) throw new Error('missing connections')
    if (!json.meta?.cwm?.workflowKey) throw new Error('missing meta.cwm.workflowKey')
    // secrets must not be hardcoded
    const raw = JSON.stringify(json)
    if (/sk-[a-zA-Z0-9]{10,}/.test(raw) || /api[_-]?key\s*[:=]\s*['\"][a-z0-9]{16,}/i.test(raw)) {
      throw new Error('possible hardcoded secret')
    }
    console.log(`OK  ${file} — ${json.name}`)
  } catch (err) {
    failed += 1
    console.error(`FAIL ${file} — ${err.message}`)
  }
}

if (!files.length) {
  console.error('No workflows found')
  process.exit(1)
}

process.exit(failed ? 1 : 0)
