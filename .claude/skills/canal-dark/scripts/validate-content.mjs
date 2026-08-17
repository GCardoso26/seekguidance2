#!/usr/bin/env node
/**
 * Validate channel/content editorial files. No network, no production.
 */
import fs from 'node:fs'
import path from 'node:path'

const dir = process.argv[2]
if (!dir) {
  console.error(JSON.stringify({ error: 'usage', hint: 'validate-content.mjs <channel-or-package-dir>' }))
  process.exit(2)
}

const requiredChannel = [
  'name',
  'language',
  'country',
  'niche',
  'subniche',
  'audience',
  'tone',
  'visual_style',
  'voice_style',
  'long_form',
  'shorts',
  'publishing',
]

function readJson(file) {
  const p = path.join(dir, file)
  if (!fs.existsSync(p)) return { missing: true, file }
  try {
    return { file, data: JSON.parse(fs.readFileSync(p, 'utf8')) }
  } catch (err) {
    return { file, error: String(err) }
  }
}

const channel = readJson('channel.json')
const content = readJson('content.json')
const findings = []

if (channel.missing) findings.push('channel.json_missing')
if (channel.error) findings.push(`channel.json_invalid:${channel.error}`)
if (channel.data) {
  for (const k of requiredChannel) {
    if (!(k in channel.data)) findings.push(`channel_missing_field:${k}`)
    else if (channel.data[k] === '' || channel.data[k] == null) findings.push(`channel_empty_field:${k}`)
  }
}

if (content.data && /fique rico|ganhe milhões|sem esforço/i.test(JSON.stringify(content.data))) {
  findings.push('prohibited_claims')
}

const report = {
  ok: findings.length === 0,
  dir: path.resolve(dir),
  findings,
  files: fs.existsSync(dir) ? fs.readdirSync(dir) : [],
  reviewRequired: findings.length > 0,
}

console.log(JSON.stringify(report, null, 2))
process.exit(report.ok ? 0 : 1)
