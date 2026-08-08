import type { PublicationMetadata, PublicationResult, ValidationResult } from './types.js'

export type PublishInput = {
  workspaceId: string
  contentId: string
  publicationId: string
  platform: string
  metadata: PublicationMetadata
  videoUri?: string
  thumbnailUri?: string
  scheduledAt?: string | null
}

export interface PlatformPublisher {
  name: string
  status(): 'READY' | 'NOT_CONFIGURED' | 'ERROR'
  validate(input: PublishInput): Promise<ValidationResult>
  publish(input: PublishInput): Promise<PublicationResult>
  schedule(input: PublishInput): Promise<PublicationResult>
  delete?(input: PublishInput): Promise<void>
}
