import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { config } from '../../config.js'

export interface AssetStorage {
  put(relPath: string, data: Buffer | string): Promise<{ uri: string; checksum: string; fileSize: number }>
  get(relPath: string): Promise<Buffer>
  exists(relPath: string): Promise<boolean>
  delete(relPath: string): Promise<void>
  resolveSafe(relPath: string): string
  root(): string
}

export class LocalFilesystemStorage implements AssetStorage {
  private base: string

  constructor(baseDir?: string) {
    this.base = path.resolve(baseDir || path.join(config.root, 'data', 'assets'))
    fs.mkdirSync(this.base, { recursive: true })
  }

  root(): string {
    return this.base
  }

  resolveSafe(relPath: string): string {
    const cleaned = relPath.replace(/\\/g, '/').replace(/^\/+/, '')
    if (cleaned.includes('..') || path.isAbsolute(relPath)) {
      throw new Error('path_injection_blocked')
    }
    const full = path.resolve(this.base, cleaned)
    if (!full.startsWith(this.base + path.sep) && full !== this.base) {
      throw new Error('path_escape_blocked')
    }
    return full
  }

  async put(relPath: string, data: Buffer | string) {
    const full = this.resolveSafe(relPath)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')
    fs.writeFileSync(full, buf)
    const checksum = createHash('sha256').update(buf).digest('hex')
    return { uri: full, checksum, fileSize: buf.length }
  }

  async get(relPath: string) {
    return fs.readFileSync(this.resolveSafe(relPath))
  }

  async exists(relPath: string) {
    return fs.existsSync(this.resolveSafe(relPath))
  }

  async delete(relPath: string) {
    const full = this.resolveSafe(relPath)
    if (fs.existsSync(full)) fs.unlinkSync(full)
  }
}

/** Prepared adapter — never SUCCESS without credentials */
export class S3StorageStub implements AssetStorage {
  async put(): Promise<{ uri: string; checksum: string; fileSize: number }> {
    throw Object.assign(new Error('provider_not_configured:s3'), { code: 'NOT_CONFIGURED' })
  }
  async get(): Promise<Buffer> {
    throw Object.assign(new Error('provider_not_configured:s3'), { code: 'NOT_CONFIGURED' })
  }
  async exists(): Promise<boolean> {
    return false
  }
  async delete(): Promise<void> {
    throw Object.assign(new Error('provider_not_configured:s3'), { code: 'NOT_CONFIGURED' })
  }
  resolveSafe(): string {
    throw Object.assign(new Error('provider_not_configured:s3'), { code: 'NOT_CONFIGURED' })
  }
  root(): string {
    return 's3://not-configured'
  }
}

export function assetRelPath(input: {
  workspaceId: string
  contentId: string
  productionId: string
  folder: 'voice' | 'visuals' | 'subtitles' | 'thumbnails' | 'final'
  filename: string
}): string {
  return path.posix.join(
    'workspaces',
    input.workspaceId,
    'content',
    input.contentId,
    'production',
    input.productionId,
    input.folder,
    input.filename,
  )
}
