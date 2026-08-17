import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const skill = path.resolve(here, '../../../.claude/skills/canal-dark')
const cursorSkill = path.resolve(here, '../../../.cursor/skills/canal-dark')

const REFERENCES = [
  'operating-model.md',
  'workflow.md',
  'content-strategy.md',
  'research.md',
  'scripting.md',
  'visual-direction.md',
  'asset-library.md',
  'voice.md',
  'composition.md',
  'shorts.md',
  'thumbnails.md',
  'metadata.md',
  'originality.md',
  'rights.md',
  'qa.md',
]

const TEMPLATES = [
  'channel.json',
  'content.json',
  'visual-bible.md',
  'storyboard.json',
  'visual-prompts.json',
  'metadata.json',
  'publish.txt',
  'credits.md',
  'qa-report.md',
]

const SCRIPTS = [
  'inspect-cwm.mjs',
  'validate-content.mjs',
  'inspect-media.mjs',
  'package-content.mjs',
  'inspect-cwm.ps1',
  'validate-content.ps1',
  'inspect-media.ps1',
  'package-content.ps1',
]

function parseFrontmatter(raw: string): Record<string, string> {
  assert.ok(raw.startsWith('---\n'), 'SKILL.md precisa de frontmatter YAML')
  const end = raw.indexOf('\n---', 4)
  assert.ok(end > 0, 'frontmatter YAML não fecha')
  const block = raw.slice(4, end)
  const out: Record<string, string> = {}
  let key = ''
  let acc = ''
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (m) {
      if (key) out[key] = acc.replace(/^>\-?\s*/, '').trim()
      key = m[1]
      acc = m[2]
    } else if (key) {
      acc += ` ${line.trim()}`
    }
  }
  if (key) out[key] = acc.replace(/^>\-?\s*/, '').trim()
  return out
}

describe('Skill canal-dark discovery + scripts', () => {
  it('SKILL.md YAML is valid and points at CWM not a parallel factory', () => {
    const raw = fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8')
    const fm = parseFrontmatter(raw)
    assert.equal(fm.name, 'canal-dark')
    assert.ok(fm.description.includes('CWM'))
    assert.match(raw, /PublishingQualityGate/)
    assert.match(raw, /mock_visual/)
    assert.doesNotMatch(raw, /criar ProductionService/)
    assert.match(raw, /INSPECT/)
  })

  it('references, templates, scripts and example channel exist', () => {
    for (const f of REFERENCES) {
      assert.ok(fs.existsSync(path.join(skill, 'references', f)), f)
    }
    for (const f of TEMPLATES) {
      assert.ok(fs.existsSync(path.join(skill, 'templates', f)), f)
    }
    for (const f of SCRIPTS) {
      assert.ok(fs.existsSync(path.join(skill, 'scripts', f)), f)
    }
    assert.ok(fs.existsSync(path.join(skill, 'examples/example-channel/channel.json')))
    assert.ok(fs.existsSync(path.join(skill, 'README.md')))
  })

  it('Cursor skill is the same tree (symlink or copy)', () => {
    assert.ok(fs.existsSync(path.join(cursorSkill, 'SKILL.md')))
    const a = fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8')
    const b = fs.readFileSync(path.join(cursorSkill, 'SKILL.md'), 'utf8')
    assert.equal(a, b)
  })

  it('inspect-cwm.mjs detects CWM contracts and Comfy isolation', () => {
    const r = spawnSync('node', [path.join(skill, 'scripts/inspect-cwm.mjs')], { encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr || r.stdout)
    const json = JSON.parse(r.stdout)
    assert.equal(json.ok, true)
    assert.equal(json.contracts.ProductionService, true)
    assert.equal(json.contracts.PublishingQualityGate, true)
    assert.equal(json.invariants.productionServiceDoesNotImportComfyUIProvider, true)
    assert.equal(json.invariants.compositionHasNoComfy, true)
  })

  it('validate-content.mjs accepts the example channel', () => {
    const r = spawnSync(
      'node',
      [path.join(skill, 'scripts/validate-content.mjs'), path.join(skill, 'examples/example-channel')],
      { encoding: 'utf8' },
    )
    assert.equal(r.status, 0, r.stderr || r.stdout)
    const json = JSON.parse(r.stdout)
    assert.equal(json.ok, true)
  })

  it('package-content.mjs is non-destructive and wouldUpload=false', () => {
    const out = path.join(os.tmpdir(), `cwm-skill-pkg-${Date.now()}`)
    const r = spawnSync(
      'node',
      [
        path.join(skill, 'scripts/package-content.mjs'),
        '--in',
        path.join(skill, 'examples/example-channel'),
        '--out',
        out,
      ],
      { encoding: 'utf8' },
    )
    assert.equal(r.status, 0, r.stderr || r.stdout)
    const json = JSON.parse(r.stdout)
    assert.equal(json.wouldUpload, false)
    assert.equal(json.packageStatus, 'READY_FOR_REVIEW')
    assert.ok(fs.existsSync(path.join(out, 'channel.json')))
  })

  it('inspect-media.mjs --help does not require ffmpeg', () => {
    const r = spawnSync('node', [path.join(skill, 'scripts/inspect-media.mjs'), '--help'], {
      encoding: 'utf8',
    })
    assert.equal(r.status, 0)
  })
})
