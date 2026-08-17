#!/usr/bin/env node
/**
 * Inspect media files. Uses ffprobe when present; otherwise NOT_CONFIGURED.
 * Never treats mock_visual as publishable.
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const target = process.argv[2]
if (!target || target === '--help') {
  console.log(JSON.stringify({ usage: 'inspect-media.mjs <file-or-dir>', ffprobe: 'optional' }, null, 2))
  process.exit(target ? 0 : 2)
}

function which(cmd) {
  const r = spawnSync('bash', ['-lc', `command -v ${cmd}`], { encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : null
}

const ffprobe = which('ffprobe')
const files = []
const st = fs.existsSync(target) ? fs.statSync(target) : null
if (!st) {
  console.error(JSON.stringify({ error: 'not_found', target }))
  process.exit(1)
}
if (st.isDirectory()) {
  for (const name of fs.readdirSync(target)) {
    if (/\.(mp4|wav|mp3|srt|vtt|png|jpg|jpeg|webp)$/i.test(name)) files.push(path.join(target, name))
  }
} else {
  files.push(target)
}

const items = files.map((file) => {
  const info = {
    file,
    bytes: fs.statSync(file).size,
    ffprobe: ffprobe ? 'READY' : 'NOT_CONFIGURED',
  }
  if (ffprobe && /\.(mp4|wav|mp3)$/i.test(file)) {
    const r = spawnSync(
      ffprobe,
      ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file],
      { encoding: 'utf8' },
    )
    if (r.status === 0) {
      try {
        info.format = JSON.parse(r.stdout)
      } catch {
        info.formatError = 'invalid_ffprobe_json'
      }
    } else {
      info.ffprobeError = r.stderr || 'ffprobe_failed'
    }
  }
  return info
})

console.log(
  JSON.stringify(
    {
      publishable: false,
      note: 'inspect-media does not authorize publish; PublishingQualityGate is sovereign',
      items,
    },
    null,
    2,
  ),
)
