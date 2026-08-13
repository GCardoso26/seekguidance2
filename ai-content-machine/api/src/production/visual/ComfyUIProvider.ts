import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { VisualAsset, VisualGenerateInput, VisualProvider } from './VisualProvider.js'
import { workflowRegistry } from './WorkflowRegistry.js'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff])
const MIN_BYTES = 32

/**
 * Local ComfyUI via HTTP (prompt → history → view).
 * Image generation only — no Wan/LTX/video.
 *
 * Env: COMFY_BASE_URL, COMFY_WORKFLOW, COMFY_TIMEOUT_MS, COMFY_POLL_MS,
 *      COMFY_CHECKPOINT, COMFY_NEGATIVE_PROMPT
 */
export class ComfyUIProvider implements VisualProvider {
  name = 'comfyui'

  status() {
    return this.baseUrl() ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }

  private baseUrl(): string {
    return (process.env.COMFY_BASE_URL || '').replace(/\/$/, '').trim()
  }

  private workflowName(): string {
    return (process.env.COMFY_WORKFLOW || 'image_default').trim() || 'image_default'
  }

  private timeoutMs(): number {
    const n = Number(process.env.COMFY_TIMEOUT_MS || 120000)
    return Number.isFinite(n) && n > 0 ? n : 120000
  }

  private pollMs(): number {
    const n = Number(process.env.COMFY_POLL_MS || 1500)
    return Number.isFinite(n) && n > 0 ? n : 1500
  }

  private checkpoint(): string {
    return process.env.COMFY_CHECKPOINT || 'v1-5-pruned-emaonly.safetensors'
  }

  private negativePrompt(): string {
    return process.env.COMFY_NEGATIVE_PROMPT || 'blurry, low quality, watermark, text, logo'
  }

  async generate(input: VisualGenerateInput): Promise<VisualAsset> {
    if (this.status() === 'NOT_CONFIGURED') {
      throw Object.assign(new Error('provider_not_configured:comfyui'), { code: 'NOT_CONFIGURED' })
    }
    if (!input.prompt?.trim()) throw new Error('comfy_empty_prompt')

    const workflowName = this.workflowName()
    const graph = workflowRegistry.materialize(workflowName, {
      prompt: input.prompt,
      negative_prompt: this.negativePrompt(),
      width: input.width,
      height: input.height,
      seed: Math.floor(Math.random() * 1_000_000_000),
      filename_prefix: `cwm_scene_${input.scene}`,
      checkpoint: this.checkpoint(),
    })
    const saveId = workflowRegistry.findSaveImageNodeId(graph)

    const promptId = await this.submitPrompt(graph)
    const imageRef = await this.waitForImage(promptId, saveId)
    const buf = await this.fetchView(imageRef)
    validateImageBuffer(buf)

    fs.mkdirSync(path.dirname(input.outPath), { recursive: true })
    fs.writeFileSync(input.outPath, buf)
    const sha256 = createHash('sha256').update(buf).digest('hex')
    const mimeType = looksJpeg(buf) ? 'image/jpeg' : 'image/png'

    return {
      path: input.outPath,
      width: input.width,
      height: input.height,
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
      },
    }
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

  private async requestJson(method: 'GET' | 'POST', pathname: string, body?: unknown): Promise<unknown> {
    const res = await this.request(pathname, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
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

  private async request(pathname: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs())
    try {
      return await fetch(`${this.baseUrl()}${pathname}`, { ...init, signal: controller.signal })
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError'
      throw Object.assign(
        new Error(aborted ? `comfy_timeout:${this.timeoutMs()}` : `comfy_fetch_failed:${err instanceof Error ? err.message : String(err)}`),
        { code: aborted ? 'TIMEOUT' : 'ERROR' },
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

export function validateImageBuffer(buf: Buffer): void {
  if (!buf || buf.length < MIN_BYTES) {
    throw Object.assign(new Error('comfy_image_too_small'), { code: 'INVALID' })
  }
  if (!looksPng(buf) && !looksJpeg(buf)) {
    throw Object.assign(new Error('comfy_image_invalid_magic'), { code: 'INVALID' })
  }
}

function looksPng(buf: Buffer): boolean {
  return buf.length >= 4 && buf.subarray(0, 4).equals(PNG_MAGIC)
}

function looksJpeg(buf: Buffer): boolean {
  return buf.length >= 3 && buf.subarray(0, 3).equals(JPEG_MAGIC)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
