import { generateHooks } from '../HookGenerator.js'
import { generateStructuredScript } from '../ScriptGenerator.js'
import type { ScriptGenerationContext } from '../types.js'
import type { ScriptProvider, ScriptProviderResult } from './ScriptProvider.js'

export class MockScriptProvider implements ScriptProvider {
  name = 'mock'

  status() {
    return 'READY' as const
  }

  async generate(ctx: ScriptGenerationContext): Promise<ScriptProviderResult> {
    const started = Date.now()
    const hooksPack = generateHooks(ctx)
    const bestHook = [...hooksPack.hooks].sort((a, b) => b.score - a.score)[0]
    const scriptPack = generateStructuredScript(ctx, bestHook)
    const durationMs = Date.now() - started
    return {
      script: scriptPack.script,
      hooks: hooksPack.hooks,
      bestHook,
      provider: this.name,
      model: scriptPack.route.model,
      tokensIn: hooksPack.tokensIn + scriptPack.tokensIn,
      tokensOut: hooksPack.tokensOut + scriptPack.tokensOut,
      durationMs,
      estimatedCostCents:
        hooksPack.route.estimatedCostCents + scriptPack.route.estimatedCostCents,
      fallbackTrail: [
        { provider: this.name, model: scriptPack.route.model, status: 'READY', durationMs },
      ],
    }
  }
}
