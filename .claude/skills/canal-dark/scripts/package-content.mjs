#!/usr/bin/env node
/**
 * Assemble an editorial package from a channel dir + optional JSON payload.
 * Delegates scoring/gates to CWM editorial modules when run via API.
 * This CLI is a filesystem helper — it does not upload.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

function arg(name, fallback = '') {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] : fallback
}

if (process.argv.includes('--help') || !arg('--in')) {
  console.log(
    JSON.stringify(
      {
        usage: 'package-content.mjs --in <dir> --out <dir>',
        note: 'Non-destructive copy of editorial artefacts. PublishingQualityGate still required for publish.',
      },
      null,
    ),
  )
  process.exit(process.argv.includes('--help') ? 0 : 2)
}

const inputDir = arg('--in')
const outputDir = arg('--out') || path.join(inputDir, 'package')
if (!fs.existsSync(inputDir)) {
  console.error(JSON.stringify({ error: 'input_not_found', inputDir }))
  process.exit(1)
}

fs.mkdirSync(outputDir, { recursive: true })
const copied = []
for (const name of fs.readdirSync(inputDir)) {
  const src = path.join(inputDir, name)
  if (!fs.statSync(src).isFile()) continue
  fs.copyFileSync(src, path.join(outputDir, name))
  copied.push(name)
}

const publish = path.join(outputDir, 'publish.txt')
if (!fs.existsSync(publish)) {
  fs.writeFileSync(
    publish,
    [
      'status=READY_FOR_REVIEW',
      '',
      'O pacote foi preparado para publicação; elegibilidade para monetização depende das políticas da plataforma, direitos, originalidade, histórico do canal e outros fatores.',
      '',
      'Nunca: MOCK_VISUAL → PUBLISH',
    ].join('\n'),
  )
  copied.push('publish.txt')
}

const hash = crypto.createHash('sha256')
for (const name of copied.sort()) hash.update(fs.readFileSync(path.join(outputDir, name)))

console.log(
  JSON.stringify(
    {
      outputDir,
      files: copied,
      sha256: hash.digest('hex'),
      packageStatus: 'READY_FOR_REVIEW',
      wouldUpload: false,
    },
    null,
    2,
  ),
)
