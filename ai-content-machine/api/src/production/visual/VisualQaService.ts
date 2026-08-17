import fs from 'node:fs'
import type { LibraryQualityStatus, VisualQaResult } from './visualTypes.js'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff])

/**
 * Visual QA — file validity + aesthetic gate before library APPROVED.
 * Does not replace Comfy buffer checks; runs after bytes land on disk.
 */
export function visualQaMinScore(): number {
  const n = Number(process.env.VISUAL_QA_MIN_SCORE || 0.7)
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : 0.7
}

export function reviewGeneratedImage(input: {
  path: string
  provider: string
  sourceType: string
  width?: number
  height?: number
  prompt?: string
  minEdge?: number
  minBytes?: number
}): VisualQaResult {
  const findings: string[] = []
  const minEdge = input.minEdge ?? 64
  const minBytes = input.minBytes ?? 64
  let score = 0.4

  if (!input.path || !fs.existsSync(input.path)) {
    return reject(['visual_qa_missing_file'], 0)
  }

  const st = fs.statSync(input.path)
  if (st.size < minBytes) {
    findings.push('visual_qa_file_too_small')
  } else if (st.size >= 40_000) {
    score += 0.12
  } else if (st.size >= 8_000) {
    score += 0.06
  }

  const buf = fs.readFileSync(input.path)
  const isPng = buf.length >= 8 && buf.subarray(0, 8).equals(PNG_MAGIC)
  const isJpeg = buf.length >= 3 && buf.subarray(0, 3).equals(JPEG_MAGIC)
  if (!isPng && !isJpeg) {
    findings.push('visual_qa_bad_magic')
  } else {
    score += 0.15
  }

  const width = Number(input.width || 0)
  const height = Number(input.height || 0)
  if (width > 0 && height > 0) {
    if (width < minEdge || height < minEdge) findings.push('visual_qa_edge_too_small')
    else score += 0.1
    if (Math.min(width, height) >= 384) score += 0.08
  }

  const provider = String(input.provider || '')
  const source = String(input.sourceType || '').toUpperCase()
  if (provider === 'mock_visual' || source === 'MOCK') {
    findings.push('visual_qa_mock_not_approvable')
    score = Math.min(score, 0.25)
  } else if (
    provider === 'comfyui' ||
    provider === 'asset_library' ||
    provider === 'pexels' ||
    provider === 'pixabay' ||
    provider === 'manual_upload'
  ) {
    score += 0.12
  }

  const prompt = String(input.prompt || '')
  if (/SUBJECT:|CAMERA:|STYLE:/.test(prompt)) score += 0.08
  if (/dark content scene/i.test(prompt)) {
    findings.push('visual_qa_legacy_dark_prompt')
    score -= 0.15
  }
  if (/deep web|gore|distorted face/i.test(prompt)) {
    findings.push('visual_qa_forbidden_aesthetic')
    score -= 0.25
  }

  score = clamp01(score)
  const threshold = visualQaMinScore()
  if (score < threshold) findings.push(`visual_qa_score_below_threshold:${score.toFixed(2)}<${threshold}`)

  const unique = [...new Set(findings)]
  const passed = unique.length === 0
  const status: LibraryQualityStatus = passed ? 'APPROVED' : 'REJECTED'
  return { passed, status, score: Number(score.toFixed(3)), findings: unique }
}

function reject(findings: string[], score: number): VisualQaResult {
  return {
    passed: false,
    status: 'REJECTED',
    score,
    findings,
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

export function parseAssetVisualQa(metadata: unknown): VisualQaResult | null {
  let meta: Record<string, unknown> = {}
  if (typeof metadata === 'string') {
    try {
      meta = JSON.parse(metadata) as Record<string, unknown>
    } catch {
      return null
    }
  } else if (metadata && typeof metadata === 'object') {
    meta = metadata as Record<string, unknown>
  }
  const qa = meta.visualQa
  if (!qa || typeof qa !== 'object') return null
  const row = qa as Record<string, unknown>
  return {
    passed: Boolean(row.passed),
    status: (String(row.status || 'REJECTED') as LibraryQualityStatus) || 'REJECTED',
    score: Number(row.score || 0),
    findings: Array.isArray(row.findings) ? row.findings.map(String) : [],
  }
}
