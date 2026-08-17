#!/usr/bin/env node
/**
 * Inspect the CWM tree. Read-only. No production run, no uploads.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function walkUp(start, marker) {
  let dir = start
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, marker))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

function which(cmd) {
  const r = spawnSync('bash', ['-lc', `command -v ${cmd}`], { encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : null
}

function existsUnder(root, rel) {
  return fs.existsSync(path.join(root, rel))
}

function fileIncludes(root, rel, needle) {
  const p = path.join(root, rel)
  if (!fs.existsSync(p)) return false
  return fs.readFileSync(p, 'utf8').includes(needle)
}

const repoRoot = walkUp(__dirname, 'ai-content-machine') || walkUp(process.cwd(), 'ai-content-machine')
const cwm = repoRoot ? path.join(repoRoot, 'ai-content-machine') : null
const api = cwm ? path.join(cwm, 'api', 'src') : null

const contracts = {
  ProductionService: 'api/src/production/ProductionService.ts',
  ScriptFactoryService: 'api/src/scriptFactory/ScriptFactoryService.ts',
  FallbackScriptProvider: 'api/src/scriptFactory/providers/FallbackScriptProvider.ts',
  OllamaScriptProvider: 'api/src/scriptFactory/providers/OllamaScriptProvider.ts',
  FallbackVoiceProvider: 'api/src/production/voice/FallbackVoiceProvider.ts',
  KokoroVoiceProvider: 'api/src/production/voice/KokoroVoiceProvider.ts',
  createVisualResolver: 'api/src/production/visual/createVisualResolver.ts',
  MediaAssetRepository: 'api/src/production/library/MediaAssetRepository.ts',
  AssetStorage: 'api/src/production/storage/LocalFilesystemStorage.ts',
  CompositionProvider: 'api/src/production/composition/CompositionProvider.ts',
  VideoComposer: 'api/src/production/VideoComposer.ts',
  PublishingQualityGate: 'api/src/production/PublishingQualityGate.ts',
  FactoryMetrics: 'api/src/production/FactoryMetrics.ts',
  VisualDirector: 'api/src/production/visual/VisualDirector.ts',
  editorialRoutes: 'api/src/routes/editorial.ts',
}

const found = {}
if (cwm) {
  for (const [name, rel] of Object.entries(contracts)) {
    found[name] = existsUnder(cwm, rel)
  }
}

const productionSrc = api ? path.join(api, 'production', 'ProductionService.ts') : ''
const compositionSrc = api ? path.join(api, 'production', 'composition', 'FfmpegCompositionProvider.ts') : ''

const report = {
  ok: Boolean(cwm),
  repoRoot,
  cwmRoot: cwm,
  tools: {
    ffmpeg: which('ffmpeg') ? 'READY' : 'NOT_CONFIGURED',
    ffprobe: which('ffprobe') ? 'READY' : 'NOT_CONFIGURED',
    node: which('node') ? 'READY' : 'NOT_CONFIGURED',
    pwsh: which('pwsh') ? 'READY' : 'NOT_CONFIGURED',
  },
  env: {
    COMFY_BASE_URL: process.env.COMFY_BASE_URL ? 'SET' : 'NOT_CONFIGURED',
    KOKORO_BASE_URL: process.env.KOKORO_BASE_URL ? 'SET' : 'NOT_CONFIGURED',
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ? 'SET' : 'NOT_CONFIGURED',
    AUTOMATION_MODE: process.env.AUTOMATION_MODE || 'unset',
  },
  contracts: found,
  invariants: cwm
    ? {
        productionServiceDoesNotImportComfyUIProvider: productionSrc
          ? !fs.readFileSync(productionSrc, 'utf8').includes('ComfyUIProvider')
          : false,
        productionServiceUsesVisualResolver: fileIncludes(
          cwm,
          'api/src/production/ProductionService.ts',
          'createVisualResolver',
        ),
        compositionHasNoComfy: compositionSrc
          ? !fs.readFileSync(compositionSrc, 'utf8').includes('ComfyUI')
          : true,
        mediaLibrarySeparate:
          existsUnder(cwm, 'api/src/production/library/MediaAssetRepository.ts') &&
          existsUnder(cwm, 'api/src/production/storage/LocalFilesystemStorage.ts'),
      }
    : {},
  skill: {
    skillMd: fs.existsSync(path.join(__dirname, '..', 'SKILL.md')),
    references: fs.existsSync(path.join(__dirname, '..', 'references', 'operating-model.md')),
  },
}

if (!report.ok) {
  console.error(JSON.stringify({ error: 'cwm_not_found', ...report }, null, 2))
  process.exit(1)
}
console.log(JSON.stringify(report, null, 2))
