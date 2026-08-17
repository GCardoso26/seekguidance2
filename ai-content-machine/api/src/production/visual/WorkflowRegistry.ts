import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export type WorkflowVars = Record<string, string | number>

const NUMERIC_KEYS = new Set(['width', 'height', 'seed', 'steps', 'cfg', 'batch_size', 'denoise'])

/**
 * Loads ComfyUI API-format graphs from disk.
 * Swap graphs via COMFY_WORKFLOW without changing CWM code.
 */
export class WorkflowRegistry {
  constructor(private readonly dir = defaultWorkflowDir()) {}

  list(): string[] {
    if (!fs.existsSync(this.dir)) return []
    return fs
      .readdirSync(this.dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/i, ''))
      .sort()
  }

  load(name: string): Record<string, unknown> {
    const file = this.resolve(name)
    const raw = fs.readFileSync(file, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw Object.assign(new Error(`comfy_workflow_invalid:${name}`), { code: 'INVALID_WORKFLOW' })
    }
    return parsed as Record<string, unknown>
  }

  materialize(name: string, vars: WorkflowVars): Record<string, unknown> {
    return walkReplace(this.load(name), vars) as Record<string, unknown>
  }

  findSaveImageNodeId(workflow: Record<string, unknown>): string {
    for (const [id, node] of Object.entries(workflow)) {
      if (node && typeof node === 'object' && (node as { class_type?: string }).class_type === 'SaveImage') {
        return id
      }
    }
    throw Object.assign(new Error('comfy_workflow_no_save_image'), { code: 'INVALID_WORKFLOW' })
  }

  private resolve(name: string): string {
    const slug = name.replace(/\.json$/i, '').trim()
    if (!slug || slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
      throw Object.assign(new Error(`comfy_workflow_invalid_name:${name}`), { code: 'INVALID_WORKFLOW' })
    }
    const file = path.join(this.dir, `${slug}.json`)
    if (!fs.existsSync(file)) {
      throw Object.assign(new Error(`comfy_workflow_not_found:${slug}`), { code: 'INVALID_WORKFLOW' })
    }
    return file
  }
}

export const workflowRegistry = new WorkflowRegistry()

function defaultWorkflowDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), 'workflows')
}

function walkReplace(value: unknown, vars: WorkflowVars): unknown {
  if (typeof value === 'string') {
    const exact = value.match(/^\{\{([a-z0-9_]+)\}\}$/i)
    if (exact) {
      const key = exact[1]
      if (!(key in vars)) return value
      const raw = vars[key]
      if (NUMERIC_KEYS.has(key) && typeof raw === 'number') return raw
      if (NUMERIC_KEYS.has(key) && typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) {
        return Number(raw)
      }
      return String(raw)
    }
    return value.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_m, key: string) =>
      key in vars ? String(vars[key]) : `{{${key}}}`,
    )
  }
  if (Array.isArray(value)) return value.map((v) => walkReplace(v, vars))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walkReplace(v, vars)
    }
    return out
  }
  return value
}
