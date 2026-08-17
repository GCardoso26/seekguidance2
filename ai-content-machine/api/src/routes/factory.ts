import type { FastifyInstance } from 'fastify'
import { scriptFactoryService } from '../scriptFactory/ScriptFactoryService.js'
import { productionService } from '../production/ProductionService.js'

export async function factoryRoutes(app: FastifyInstance) {
  /** One-shot readiness check across script/voice/visual/composition providers. */
  app.get('/api/factory/status', async () => {
    const script = scriptFactoryService.providersStatus()
    const production = productionService.providersStatus()
    const comfyProbe = await productionService.probeComfy()
    return {
      script,
      voice: production.voice,
      visual: {
        ...production.visual,
        comfy: comfyProbe.status,
        comfyProbe,
      },
      composition: production.composition,
      thumbnail: production.thumbnail,
      storage: production.storage,
      ffmpeg: production.ffmpeg,
    }
  })
}
