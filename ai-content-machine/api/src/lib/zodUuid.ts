import { z } from 'zod'

/** Empty / null / literal "undefined" from n8n templates → undefined */
function blankToUndefined(value: unknown): unknown {
  if (value === '' || value === null || value === 'undefined') return undefined
  return value
}

export const uuid = z.preprocess(blankToUndefined, z.string().uuid())
export const optionalUuid = z.preprocess(blankToUndefined, z.string().uuid().optional())
