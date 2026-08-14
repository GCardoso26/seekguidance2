import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { ComfyProbeResult } from '../types.js'
import type { VisualAsset, VisualGenerateInput, VisualProvider } from './VisualProvider.js'
import { workflowRegistry } from './WorkflowRegistry.js'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff])
const DEFAULT_JOB_TIMEOUT_MS = 900_000
const DEFAULT_HTTP_TIMEOUT_MS = 30_000
const DEFAULT_HEALTH_TIMEOUT_MS = 5_000
const DEFAULT_POLL_MS = 3_000
const DEFAULT_MIN_BYTES = 64
const DEFAULT_MIN_EDGE = 64

/**
 * Local / remote ComfyUI via HTTP (prompt → history → view).
 * Image generation only — no Wan/LTX/video.
 *
 * Env: COMFY_BASE_URL, COMFY_WORKFLOW, COMFY_TIMEOUT_MS, COMFY_HTTP_TIMEOUT_MS,
 *      COMFY_HEALTH_TIMEOUT_MS, COMFY_POLL_MS, COMFY_CHECKPOINT,
 *      COMFY_NEGATIVE_PROMPT, COMFY_WIDTH, COMFY_HEIGHT, COMFY_STEPS, COMFY_CFG
 */
export class ComfyUIProvider implements VisualProvider {
  name = 'comfyui'
  /** After a job TIMEOUT / unreachable, skip Comfy until a live probe succeeds. */
  private circuitOpen = false

  status() {
    if (!this.baseUrl()) return 'NOT_CONFIGURED' as const
    if (this.circuitOpen) return 'ERROR' as const
    return 'READY' as const
  }

  async probe(): Promise<ComfyProbeResult> {
    if (!this.baseUrl()) {
      return { status: 'NOT_CONFIGURED', latencyMs: 0, detail: 'COMFY_BASE_URL empty' }
    }
    const t0 = Date.now()
    try {
      const json = (await this.requestJson('GET', '/system_stats', undefined, this.healthTimeoutMs())) as {
        system?: unknown
      }
      const latencyMs = Date.now() - t0
      if (!json || typeof json !== 'object') {
        return { status: 'ERROR', latencyMs, endpoint: '/system_stats', detail: 'comfy_health_empty' }
      }
      this.circuitOpen = false
      return { status: 'READY', latencyMs, endpoint: '/system_stats', detail: 'ok' }
    } catch (err) {
      return {
        status: 'ERROR',
        latencyMs: Date.now() - t0,
        endpoint: '/system_stats',
        detail: err instanceof Error ? err.message : String(err),
      }
    }
  }

  private baseUrl(): string {
    return (process.env.COMFY_BASE_URL || '').replace(/\/$/, '').trim()
  }

  private workflowName(): string {
    return (process.env.COMFY_WORKFLOW || 'image_default').trim() || 'image_default'
  }

  private timeoutMs(): number {
    return positiveInt(process.env.COMFY_TIMEOUT_MS, DEFAULT_JOB_TIMEOUT_MS)
  }

  private httpTimeoutMs(): number {
    return positiveInt(process.env.COMFY_HTTP_TIMEOUT_MS, DEFAULT_HTTP_TIMEOUT_MS)
  }

  private healthTimeoutMs(): number {
    return positiveInt(process.env.COMFY_HEALTH_TIMEOUT_MS, DEFAULT_HEALTH_TIMEOUT_MS)
  }

  private pollMs(): number {
    return positiveInt(process.env.COMFY_POLL_MS, DEFAULT_POLL_MS)
  }

  private checkpoint(): string {
    return process.env.COMFY_CHECKPOINT || 'v1-5-pruned-emaonly.safetensors'
  }

  private negativePrompt(): string {
    return process.env.COMFY_NEGATIVE_PROMPT || 'blurry, low quality, watermark, text, logo, deformed'
  }

  private genWidth(inputWidth: number): number {
    const n = Number(process.env.COMFY_WIDTH || 0)
    return Number.isFinite(n) && n >= 64 ? Math.round(n) : inputWidth
  }

  private genHeight(inputHeight: number): number {
    const n = Number(process.env.COMFY_HEIGHT || 0)
    return Number.isFinite(n) && n >= 64 ? Math.round(n) : inputHeight
  }

  private steps(): number {
    const name = this.workflowName()
    const fallback = name === 'image_a1_cpu' ? 4 : name === 'image_cinematic' ? 20 : 8
    return positiveInt(process.env.COMFY_STEPS, fallback)
  }

  private cfg(): number {
    const name = this.workflowName()
    const fallback = name === 'image_a1_cpu' ? 2.5 : name === 'image_cinematic' ? 6.5 : 4
    const n = Number(process.env.COMFY_CFG)
    return Number.isFinite(n) && n > 0 ? n : fallback
  }

  async generate(input: VisualGenerateInput): Promise<VisualAsset> {
    if (!this.baseUrl()) {
      throw Object.assign(new Error('provider_not_configured:comfyui'), { code: 'NOT_CONFIGURED' })
    }
    if (!input.prompt?.trim()) throw new Error('comfy_empty_prompt')

    const health = await this.probe()
    if (health.status !== 'READY') {
      this.tripCircuit()
      throw Object.assign(new Error(`comfy_unreachable:${health.detail || health.status}`), { code: 'ERROR' })
    }

    const workflowName = this.workflowName()
    const width = this.genWidth(input.width)
    const height = this.genHeight(input.height)
    const graph = workflowRegistry.materialize(workflowName, {
      prompt: input.prompt,
      negative_prompt: this.negativePrompt(),
      width,
      height,
      seed: Math.floor(Math.random() * 1_000_000_000),
      filename_prefix: `cwm_scene_${input.scene}`,
      checkpoint: this.checkpoint(),
      steps: this.steps(),
      cfg: this.cfg(),
    })
    const saveId = workflowRegistry.findSaveImageNodeId(graph)

    const promptId = await this.submitPrompt(graph)
    let imageRef: { filename: string; subfolder: string; type: string }
    try {
      imageRef = await this.waitForImage(promptId, saveId)
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code) : ''
      if (code === 'TIMEOUT') this.tripCircuit()
      throw err
    }
    const buf = await this.fetchView(imageRef)
    validateImageBuffer(buf)

    fs.mkdirSync(path.dirname(input.outPath), { recursive: true })
    fs.writeFileSync(input.outPath, buf)
    const sha256 = createHash('sha256').update(buf).digest('hex')
    const mimeType = looksJpeg(buf) ? 'image/jpeg' : 'image/png'
    const dims = pngSize(buf) || jpegSize(buf)

    return {
      path: input.outPath,
      width: dims?.width || width,
      height: dims?.height || height,
      sourceType: 'GENERATED',
      provider: this.name,
      mimeType,
      license: 'GENERATED',
      prompt: input.prompt,
      costCents: 0,
      metadata: {
        sourceUrl: `comfyui://${promptId}`,
        generatedAt: new Date().toISOString(),
        scene: input.scene,
        workflow: workflowName,
        promptId,
        sha256,
        jobTimeoutMs: this.timeoutMs(),
        requestedWidth: width,
        requestedHeight: height,
        steps: this.steps(),
        healthMs: health.latencyMs,
      },
    }
  }

  private tripCircuit() {
    this.circuitOpen = true
  }

  private async submitPrompt(prompt: Record<string, unknown>): Promise<string> {
    const json = (await this.requestJson('POST', '/prompt', { prompt, client_id: 'cwm' })) as {
      prompt_id?: string
      error?: { message?: string } | string
    }
    if (json.error) {
      const msg = typeof json.error === 'string' ? json.error : json.error.message || 'prompt_error'
      throw Object.assign(new Error(`comfy_prompt_error:${msg}`), { code: 'ERROR' })
    }
    if (!json.prompt_id) {
      throw Object.assign(new Error('comfy_prompt_missing_id'), { code: 'ERROR' })
    }
    return json.prompt_id
  }

  private async waitForImage(
    promptId: string,
    saveId: string,
  ): Promise<{ filename: string; subfolder: string; type: string }> {
    const deadline = Date.now() + this.timeoutMs()
    while (Date.now() < deadline) {
      const history = await this.requestJson('GET', `/history/${encodeURIComponent(promptId)}`)
      const entry = unwrapHistory(history, promptId)
      if (entry) {
        const status = entry.status as { completed?: boolean; status_str?: string } | undefined
        if (status?.status_str === 'error') {
          throw Object.assign(new Error('comfy_job_error'), { code: 'ERROR' })
        }
        const img = extractImage(entry.outputs, saveId)
        if (img) return img
        if (status?.completed) {
          throw Object.assign(new Error('comfy_job_no_image'), { code: 'ERROR' })
        }
      }
      await sleep(this.pollMs())
    }
    throw Object.assign(new Error(`comfy_timeout:${this.timeoutMs()}`), { code: 'TIMEOUT' })
  }

  private async fetchView(ref: { filename: string; subfolder: string; type: string }): Promise<Buffer> {
    const qs = new URLSearchParams({
      filename: ref.filename,
      subfolder: ref.subfolder || '',
      type: ref.type || 'output',
    })
    const res = await this.request(`/view?${qs.toString()}`)
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw Object.assign(new Error(`comfy_view_${res.status}:${body.slice(0, 200)}`), { code: 'ERROR' })
    }
    return Buffer.from(await res.arrayBuffer())
  }

  private async requestJson(
    method: 'GET' | 'POST',
    pathname: string,
    body?: unknown,
    timeoutMs?: number,
  ): Promise<unknown> {
    const res = await this.request(
      pathname,
      {
        method,
        headers: body ? { 'content-type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
      timeoutMs,
    )
    const text = await res.text()
    if (!res.ok) {
      throw Object.assign(new Error(`comfy_http_${res.status}:${text.slice(0, 200)}`), { code: 'ERROR' })
    }
    if (!text.trim()) return {}
    try {
      return JSON.parse(text) as unknown
    } catch {
      throw Object.assign(new Error('comfy_invalid_json'), { code: 'ERROR' })
    }
  }

  private async request(pathname: string, init?: RequestInit, timeoutMs?: number): Promise<Response> {
    const ms = timeoutMs ?? this.httpTimeoutMs()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    try {
      return await fetch(`${this.baseUrl()}${pathname}`, { ...init, signal: controller.signal })
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError'
      throw Object.assign(
        new Error(
          aborted
            ? `comfy_http_timeout:${ms}`
            : `comfy_fetch_failed:${err instanceof Error ? err.message : String(err)}`,
        ),
        { code: 'ERROR' },
      )
    } finally {
      clearTimeout(timer)
    }
  }
}

function unwrapHistory(raw: unknown, promptId: string): { status?: unknown; outputs?: unknown } | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (obj.outputs || obj.status) return obj as { status?: unknown; outputs?: unknown }
  const nested = obj[promptId]
  if (nested && typeof nested === 'object') return nested as { status?: unknown; outputs?: unknown }
  return null
}

function extractImage(
  outputs: unknown,
  saveId: string,
): { filename: string; subfolder: string; type: string } | null {
  if (!outputs || typeof outputs !== 'object') return null
  const map = outputs as Record<string, { images?: Array<{ filename?: string; subfolder?: string; type?: string }> }>
  const nodes = [saveId, ...Object.keys(map)]
  for (const id of nodes) {
    const images = map[id]?.images
    const first = images?.[0]
    if (first?.filename) {
      return {
        filename: first.filename,
        subfolder: first.subfolder || '',
        type: first.type || 'output',
      }
    }
  }
  return null
}

export function validateImageBuffer(
  buf: Buffer,
  opts?: { minBytes?: number; minEdge?: number },
): void {
  const minBytes = opts?.minBytes ?? Number(process.env.COMFY_MIN_IMAGE_BYTES || DEFAULT_MIN_BYTES)
  const minEdge = opts?.minEdge ?? Number(process.env.COMFY_MIN_EDGE || DEFAULT_MIN_EDGE)
  if (!buf || buf.length < minBytes) {
    throw Object.assign(new Error('comfy_image_too_small'), { code: 'INVALID' })
  }
  if (!looksPng(buf) && !looksJpeg(buf)) {
    throw Object.assign(new Error('comfy_image_invalid_magic'), { code: 'INVALID' })
  }
  if (looksPng(buf)) {
    const size = pngSize(buf)
    if (!size) {
      throw Object.assign(new Error('comfy_image_invalid_ihdr'), { code: 'INVALID' })
    }
    if (size.width < minEdge || size.height < minEdge) {
      throw Object.assign(
        new Error(`comfy_image_too_small_edge:${size.width}x${size.height}`),
        { code: 'INVALID' },
      )
    }
  } else if (looksJpeg(buf)) {
    const size = jpegSize(buf)
    if (!size) {
      throw Object.assign(new Error('comfy_image_invalid_jpeg'), { code: 'INVALID' })
    }
    if (size.width < minEdge || size.height < minEdge) {
      throw Object.assign(
        new Error(`comfy_image_too_small_edge:${size.width}x${size.height}`),
        { code: 'INVALID' },
      )
    }
  }
}

export function pngSize(buf: Buffer): { width: number; height: number } | null {
  if (!looksPng(buf) || buf.length < 24) return null
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  if (!width || !height || width > 8192 || height > 8192) return null
  return { width, height }
}

function looksPng(buf: Buffer): boolean {
  return buf.length >= 8 && buf.subarray(0, 8).equals(PNG_MAGIC)
}

function looksJpeg(buf: Buffer): boolean {
  return buf.length >= 3 && buf.subarray(0, 3).equals(JPEG_MAGIC)
}

/** SOF0/SOF2 width×height. Returns null if the JPEG is truncated. */
export function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (!looksJpeg(buf) || buf.length < 10) return null
  let i = 2
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null
    const marker = buf[i + 1]
    if (marker === 0xd9) return null
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = buf.readUInt16BE(i + 5)
      const width = buf.readUInt16BE(i + 7)
      if (!width || !height || width > 8192 || height > 8192) return null
      return { width, height }
    }
    const len = buf.readUInt16BE(i + 2)
    if (len < 2) return null
    i += 2 + len
  }
  return null
}

function positiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
