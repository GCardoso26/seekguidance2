import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { reviewVisualPublishability } from '../production/PublishingQualityGate.js'
import { evaluateQualityGate } from '../production/ContentPackageBuilder.js'
import { evaluateRights } from './RightsGate.js'
import { scoreOriginality } from './OriginalityService.js'
import type { RightsVerdict, OriginalityVerdict } from './types.js'

export type EditorialPackageInput = {
  outputDir: string
  channel: Record<string, unknown>
  research?: Record<string, unknown>
  idea?: Record<string, unknown>
  scriptMd?: string
  storyboard?: unknown
  visualBible?: string
  visualPrompts?: unknown
  metadata?: Record<string, unknown>
  credits?: string[]
  assets?: Array<Record<string, unknown>>
  qa?: Record<string, unknown>
  productionId?: string
  contentId?: string
  version?: number
}

export type EditorialPackageResult = {
  outputDir: string
  files: string[]
  sha256: string
  packageStatus: 'READY_FOR_PUBLISH' | 'READY_FOR_REVIEW' | 'FAILED'
  rights: RightsVerdict
  originality: OriginalityVerdict
  visualAuthorized: boolean
  monetizationNote: string
}

export const MONETIZATION_NOTE =
  'O pacote foi preparado para publicação; elegibilidade para monetização depende das políticas da plataforma, direitos, originalidade, histórico do canal e outros fatores.'

function write(dir: string, name: string, body: string) {
  const p = path.join(dir, name)
  fs.writeFileSync(p, body.endsWith('\n') ? body : `${body}\n`)
  return name
}

export function buildEditorialPackage(input: EditorialPackageInput): EditorialPackageResult {
  fs.mkdirSync(input.outputDir, { recursive: true })
  const assets = input.assets || []
  const visualReview = reviewVisualPublishability(assets)
  const rights = evaluateRights({
    assets: assets.map((a) => ({
      license: String(a.license || ''),
      source_type: String(a.source_type || a.sourceType || ''),
      type: String(a.type || ''),
      provider: String(a.provider || ''),
    })),
    claimedCredits: input.credits,
  })
  const originality = scoreOriginality({
    title: String(input.idea?.title || input.metadata?.title || ''),
    hook: String(input.metadata?.hook || ''),
    cta: String(input.metadata?.cta || ''),
    body: String(input.scriptMd || ''),
  })

  const gate = {
    voiceValid: assets.some((a) => a.type === 'AUDIO' && Number(a.file_size) > 0),
    visualsValid: assets.some((a) => a.type === 'IMAGE' && Number(a.file_size) > 0),
    subtitlesValid: assets.some((a) => a.type === 'SUBTITLE'),
    finalVideoValid: assets.some((a) => a.type === 'FINAL_VIDEO' && Number(a.file_size) > 0),
    thumbnailValid: assets.some((a) => a.type === 'THUMBNAIL' && Number(a.file_size) > 0),
    storageValid: true,
    checksumsValid: assets.filter((a) => a.is_current).every((a) => String(a.checksum || '').length === 64),
    licensesKnown: !rights.autoPublishBlocked,
    noUnresolvedFailure: true,
    visualsPublishable: visualReview.authorized,
  }

  let packageStatus: EditorialPackageResult['packageStatus'] =
    evaluateQualityGate(gate) === 'READY_FOR_PUBLISH' ? 'READY_FOR_PUBLISH' : 'READY_FOR_REVIEW'
  if (!visualReview.authorized || rights.reviewRequired || originality.reviewRequired) {
    packageStatus = 'READY_FOR_REVIEW'
  }

  const files = [
    write(input.outputDir, 'channel.json', JSON.stringify(input.channel, null, 2)),
    write(input.outputDir, 'research.json', JSON.stringify(input.research || { status: 'NOT_CONFIGURED' }, null, 2)),
    write(input.outputDir, 'idea.json', JSON.stringify(input.idea || {}, null, 2)),
    write(input.outputDir, 'script.md', input.scriptMd || '# Script\n\nNOT_CONFIGURED\n'),
    write(input.outputDir, 'storyboard.json', JSON.stringify(input.storyboard || [], null, 2)),
    write(input.outputDir, 'visual-bible.md', input.visualBible || '# Visual Bible\n\nUse o profile CWM.\n'),
    write(input.outputDir, 'visual-prompts.json', JSON.stringify(input.visualPrompts || {}, null, 2)),
    write(
      input.outputDir,
      'metadata.json',
      JSON.stringify(
        {
          ...input.metadata,
          productionId: input.productionId,
          contentId: input.contentId,
          version: input.version ?? 1,
          packageStatus,
          visualReview,
        },
        null,
        2,
      ),
    ),
    write(
      input.outputDir,
      'publish.txt',
      [
        `status=${packageStatus}`,
        `productionId=${input.productionId || ''}`,
        `contentId=${input.contentId || ''}`,
        '',
        MONETIZATION_NOTE,
        '',
        'Nunca: MOCK_VISUAL → PUBLISH',
      ].join('\n'),
    ),
    write(
      input.outputDir,
      'credits.md',
      rights.credits.length
        ? `# Créditos\n\n${rights.credits.map((c) => `- ${c}`).join('\n')}\n`
        : `# Créditos\n\nUNKNOWN — não inventar créditos. Publicação automática bloqueada se os direitos forem UNKNOWN.\n`,
    ),
    write(
      input.outputDir,
      'qa-report.md',
      [
        '# QA report',
        '',
        `- packageStatus: ${packageStatus}`,
        `- visualAuthorized: ${visualReview.authorized}`,
        `- visualVerdict: ${visualReview.verdict}`,
        `- rights: ${rights.classification}`,
        `- originality: ${originality.originalityScore}`,
        `- repetition: ${originality.repetitionScore}`,
        '',
        '## Findings',
        ...visualReview.findings.map((f) => `- visual: ${f}`),
        ...rights.findings.map((f) => `- rights: ${f}`),
        ...originality.findings.map((f) => `- originality: ${f}`),
        '',
        '## PublishingQualityGate',
        'Soberano. mock_visual nunca autoriza READY_FOR_PUBLISH.',
      ].join('\n'),
    ),
  ]

  const hash = crypto.createHash('sha256')
  for (const name of files.sort()) {
    hash.update(name)
    hash.update(fs.readFileSync(path.join(input.outputDir, name)))
  }

  return {
    outputDir: input.outputDir,
    files,
    sha256: hash.digest('hex'),
    packageStatus,
    rights,
    originality,
    visualAuthorized: visualReview.authorized,
    monetizationNote: MONETIZATION_NOTE,
  }
}
