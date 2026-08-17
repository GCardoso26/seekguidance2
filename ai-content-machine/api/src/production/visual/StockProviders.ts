import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import type { ProviderStatus } from '../types.js'
import type { VisualAsset, VisualGenerateInput, VisualProvider } from './VisualProvider.js'
import { expandStockQueries } from './stockQueries.js'

export type StockHttpErrorCode =
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'INVALID_RESPONSE'
  | 'DOWNLOAD_ERROR'
  | 'VALIDATION_ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'UNKNOWN'

type SearchHit = {
  id: string
  url: string
  width: number
  height: number
  author?: string
  license?: string
  pageUrl?: string
}

function classifyStatus(http: number): StockHttpErrorCode {
  if (http === 401 || http === 403) return 'AUTH_ERROR'
  if (http === 404) return 'NOT_FOUND'
  if (http === 429) return 'RATE_LIMIT'
  if (http >= 500) return 'PROVIDER_UNAVAILABLE'
  return 'UNKNOWN'
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/abort/i.test(msg)) {
      throw Object.assign(new Error(`TIMEOUT:${url}`), { code: 'TIMEOUT' })
    }
    throw Object.assign(new Error(`PROVIDER_UNAVAILABLE:${msg}`), { code: 'PROVIDER_UNAVAILABLE' })
  } finally {
    clearTimeout(timer)
  }
}

export abstract class StockImageProvider implements VisualProvider {
  abstract name: string
  abstract status(): ProviderStatus
  protected abstract apiKey(): string
  protected abstract search(query: string, timeoutMs: number): Promise<SearchHit[]>
  protected timeoutMs(): number {
    const n = Number(process.env.STOCK_TIMEOUT_MS || 15000)
    return Number.isFinite(n) && n > 0 ? n : 15000
  }

  protected async getJson(url: string, headers: Record<string, string>): Promise<{ http: number; json: unknown }> {
    const res = await fetchWithTimeout(url, { headers }, this.timeoutMs())
    let json: unknown = null
    try {
      json = await res.json()
    } catch {
      json = null
    }
    if (!res.ok) {
      throw Object.assign(new Error(`${this.name}_http:${res.status}`), {
        code: classifyStatus(res.status),
      })
    }
    return { http: res.status, json }
  }

  async generate(input: VisualGenerateInput): Promise<VisualAsset> {
    if (this.status() !== 'READY') {
      throw Object.assign(new Error(`provider_not_configured:${this.name}`), { code: 'NOT_CONFIGURED' })
    }
    const queries =
      input.searchQueries?.length
        ? input.searchQueries
        : expandStockQueries({
            role: input.role,
            subject: input.subject,
            visualIntent: input.visualIntent,
            narration: input.prompt,
          })
    let lastErr: unknown
    for (const query of queries) {
      try {
        const hits = await this.search(query, this.timeoutMs())
        const portrait = hits.find((h) => h.height >= h.width) || hits[0]
        if (!portrait) continue
        const buf = await this.download(portrait.url)
        if (buf.length < 64) {
          throw Object.assign(new Error('VALIDATION_ERROR:too_small'), { code: 'VALIDATION_ERROR' })
        }
        fs.mkdirSync(path.dirname(input.outPath), { recursive: true })
        fs.writeFileSync(input.outPath, buf)
        const sha256 = crypto.createHash('sha256').update(buf).digest('hex')
        return {
          path: input.outPath,
          width: portrait.width || input.width,
          height: portrait.height || input.height,
          sourceType: 'STOCK',
          provider: this.name,
          mimeType: 'image/jpeg',
          license: portrait.license || 'STOCK',
          prompt: input.prompt,
          costCents: 0,
          metadata: {
            sha256,
            sourceUrl: portrait.pageUrl || portrait.url,
            author: portrait.author,
            query,
            stockId: portrait.id,
            generatedAt: new Date().toISOString(),
          },
        }
      } catch (err) {
        lastErr = err
        const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code) : ''
        if (code === 'AUTH_ERROR') throw err
      }
    }
    const code =
      lastErr && typeof lastErr === 'object' && 'code' in lastErr
        ? String((lastErr as { code?: string }).code)
        : 'NOT_FOUND'
    throw Object.assign(new Error(`${this.name}_miss:${code}`), { code: code || 'NOT_FOUND' })
  }

  private async download(url: string): Promise<Buffer> {
    const res = await fetchWithTimeout(url, {}, this.timeoutMs())
    if (!res.ok) {
      throw Object.assign(new Error(`DOWNLOAD_ERROR:${res.status}`), { code: 'DOWNLOAD_ERROR' })
    }
    return Buffer.from(await res.arrayBuffer())
  }
}

export class PexelsProvider extends StockImageProvider {
  name = 'pexels'

  status(): ProviderStatus {
    return this.apiKey() ? 'READY' : 'NOT_CONFIGURED'
  }

  protected apiKey(): string {
    return (process.env.PEXELS_API_KEY || '').trim()
  }

  protected async search(query: string): Promise<SearchHit[]> {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=8`
    const { json } = await this.getJson(url, { Authorization: this.apiKey() })
    const photos = (json as { photos?: Array<Record<string, unknown>> })?.photos
    if (!Array.isArray(photos)) {
      throw Object.assign(new Error('INVALID_RESPONSE:pexels'), { code: 'INVALID_RESPONSE' })
    }
    return photos.map((p) => {
      const src = (p.src || {}) as Record<string, string>
      return {
        id: String(p.id),
        url: src.large2x || src.large || src.original || '',
        width: Number(p.width || 0),
        height: Number(p.height || 0),
        author: String((p.photographer as string) || ''),
        license: 'PEXELS',
        pageUrl: String(p.url || ''),
      }
    }).filter((h) => h.url)
  }
}

export class PixabayProvider extends StockImageProvider {
  name = 'pixabay'

  status(): ProviderStatus {
    return this.apiKey() ? 'READY' : 'NOT_CONFIGURED'
  }

  protected apiKey(): string {
    return (process.env.PIXABAY_API_KEY || '').trim()
  }

  protected async search(query: string): Promise<SearchHit[]> {
    const url =
      `https://pixabay.com/api/?key=${encodeURIComponent(this.apiKey())}` +
      `&q=${encodeURIComponent(query)}&image_type=photo&orientation=vertical&safesearch=true&per_page=8`
    const { json } = await this.getJson(url, {})
    const hits = (json as { hits?: Array<Record<string, unknown>> })?.hits
    if (!Array.isArray(hits)) {
      throw Object.assign(new Error('INVALID_RESPONSE:pixabay'), { code: 'INVALID_RESPONSE' })
    }
    return hits.map((p) => ({
      id: String(p.id),
      url: String(p.largeImageURL || p.webformatURL || ''),
      width: Number(p.imageWidth || p.webformatWidth || 0),
      height: Number(p.imageHeight || p.webformatHeight || 0),
      author: String(p.user || ''),
      license: 'PIXABAY',
      pageUrl: String(p.pageURL || ''),
    })).filter((h) => h.url)
  }
}
