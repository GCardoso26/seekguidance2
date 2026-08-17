import type { VisualAsset, VisualGenerateInput, VisualProvider } from './VisualProvider.js'
import { buildManualAssetRequest, type ManualAssetRequest } from './stockQueries.js'

/**
 * Last real-production visual step. Never paints color bars.
 * Throws AWAITING_USER with a MANUAL_ASSET_REQUEST payload.
 */
export class ManualFallbackProvider implements VisualProvider {
  name = 'manual_fallback'

  status() {
    return 'READY' as const
  }

  async generate(input: VisualGenerateInput): Promise<VisualAsset> {
    const request: ManualAssetRequest = buildManualAssetRequest({
      scene: input.scene,
      role: input.role,
      subject: input.subject,
      visualIntent: input.visualIntent,
      narration: input.prompt,
      reason: 'automatic_stock_and_optional_comfy_missed',
    })
    throw Object.assign(new Error(`waiting_assets:scene:${input.scene}`), {
      code: 'AWAITING_USER',
      request,
    })
  }
}
