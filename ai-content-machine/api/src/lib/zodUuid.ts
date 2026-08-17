import { z } from 'zod'
import { config } from '../config.js'

/** Empty / null / literal "undefined" from n8n templates → undefined */
export function blankToUndefined(value: unknown): unknown {
  if (value === '' || value === null || value === 'undefined') return undefined
  return value
}

export const uuid = z.preprocess(blankToUndefined, z.string().uuid())
export const optionalUuid = z.preprocess(blankToUndefined, z.string().uuid().optional())

/** Required UUID with fallback to CWM_DEFAULT_WORKSPACE_ID (n8n cron safety net) */
export const workspaceIdField = z.preprocess((value) => {
  const cleaned = blankToUndefined(value)
  if (cleaned !== undefined) return cleaned
  return blankToUndefined(config.defaultWorkspaceId)
}, z.string().uuid())
