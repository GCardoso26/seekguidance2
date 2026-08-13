import { ComfyUIProvider } from './ComfyUIProvider.js'
import { FallbackVisualProvider } from './FallbackVisualProvider.js'
import { MockVisualProvider } from './MockVisualProvider.js'

/** Wire the MISS visual chain. ProductionService must not import ComfyUI. */
export function createVisualResolver(): FallbackVisualProvider {
  return new FallbackVisualProvider(new ComfyUIProvider(), new MockVisualProvider())
}
