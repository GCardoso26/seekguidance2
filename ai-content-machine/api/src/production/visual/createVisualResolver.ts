import { config } from '../../config.js'
import { ComfyUIProvider } from './ComfyUIProvider.js'
import { FallbackVisualProvider } from './FallbackVisualProvider.js'
import { ManualFallbackProvider } from './ManualFallbackProvider.js'
import { MockVisualProvider } from './MockVisualProvider.js'
import { PexelsProvider, PixabayProvider } from './StockProviders.js'

/**
 * MISS visual chain. ProductionService must not import ComfyUI.
 * Production: Library (caller) → Pexels → Pixabay → optional Comfy → Manual.
 * Dev/test (`AUTOMATION_MODE=mock`): Mock remains last so existing tests keep an MP4.
 */
export function createVisualResolver(): FallbackVisualProvider {
  const tail =
    config.automationMode === 'production' ? new ManualFallbackProvider() : new MockVisualProvider()
  return new FallbackVisualProvider([
    new PexelsProvider(),
    new PixabayProvider(),
    new ComfyUIProvider(),
    tail,
  ])
}
