import type { RightsClass, RightsVerdict } from './types.js'

const CLASSES = new Set<RightsClass>([
  'ORIGINAL',
  'PUBLIC_DOMAIN',
  'LICENSED',
  'USER_OWNED',
  'UNKNOWN',
  'RESTRICTED',
])

const MOCK_AS_UNKNOWN_FOR_PUBLISH = new Set(['MOCK', 'UNKNOWN', '', 'NULL'])

export function normalizeRightsClass(raw: string | null | undefined): RightsClass {
  const v = String(raw || 'UNKNOWN').toUpperCase().trim()
  if (v === 'GENERATED' || v === 'STOCK' || v === 'UPLOADED') return 'ORIGINAL'
  if (CLASSES.has(v as RightsClass)) return v as RightsClass
  if (MOCK_AS_UNKNOWN_FOR_PUBLISH.has(v)) return 'UNKNOWN'
  return 'UNKNOWN'
}

export function evaluateRights(input: {
  assets?: Array<{ license?: string; source_type?: string; type?: string; provider?: string }>
  claimedCredits?: string[]
  inventCredits?: boolean
}): RightsVerdict {
  const findings: string[] = []
  const credits = [...(input.claimedCredits || [])]
  if (input.inventCredits) {
    findings.push('credits_must_not_be_invented')
  }

  const classes = (input.assets || []).map((a) => {
    const license = normalizeRightsClass(a.license || a.source_type)
    if (String(a.provider || '') === 'mock_visual' || String(a.source_type || '').toUpperCase() === 'MOCK') {
      return 'UNKNOWN' as RightsClass
    }
    return license
  })

  let classification: RightsClass = classes[0] || 'UNKNOWN'
  if (classes.some((c) => c === 'RESTRICTED')) classification = 'RESTRICTED'
  else if (classes.some((c) => c === 'UNKNOWN') || !classes.length) classification = 'UNKNOWN'
  else if (classes.every((c) => c === 'ORIGINAL')) classification = 'ORIGINAL'
  else if (classes.every((c) => c === 'PUBLIC_DOMAIN' || c === 'ORIGINAL')) classification = 'PUBLIC_DOMAIN'
  else if (classes.some((c) => c === 'LICENSED')) classification = 'LICENSED'
  else if (classes.some((c) => c === 'USER_OWNED')) classification = 'USER_OWNED'

  if (!credits.length && classification === 'LICENSED') {
    findings.push('licensed_without_credits')
  }
  if (classification === 'UNKNOWN') findings.push('rights_unknown_blocks_auto_publish')
  if (classification === 'RESTRICTED') findings.push('rights_restricted')

  const autoPublishBlocked = classification === 'UNKNOWN' || classification === 'RESTRICTED' || findings.includes('licensed_without_credits')
  return {
    classification,
    publishable: classification !== 'RESTRICTED',
    autoPublishBlocked,
    credits,
    findings,
    reviewRequired: autoPublishBlocked,
  }
}
