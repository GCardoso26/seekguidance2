import type { ScriptGenerationContext } from '../types.js'
import type { ScriptProvider, ScriptProviderResult } from './ScriptProvider.js'
import { buildScriptLlmMessages } from './scriptPrompt.js'
import { chatCompletions, validateLlmScriptContent } from './openaiCompatibleChat.js'

/**
 * Local Ollama via OpenAI-compatible /v1/chat/completions.
 *
 * Env: OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT_MS
 */
export class OllamaScriptProvider implements ScriptProvider {
  name = 'ollama'

  status() {
    return this.baseUrl() ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }

  private baseUrl(): string {
    return (process.env.OLLAMA_BASE_URL || '').trim()
  }

  private model(): string {
    return process.env.OLLAMA_MODEL || 'llama3.2'
  }

  private timeoutMs(): number {
    const n = Number(process.env.OLLAMA_TIMEOUT_MS || 60000)
    return Number.isFinite(n) && n > 0 ? n : 60000
  }

  async generate(ctx: ScriptGenerationContext): Promise<ScriptProviderResult> {
    if (this.status() === 'NOT_CONFIGURED') {
      throw Object.assign(new Error('provider_not_configured:ollama'), { code: 'NOT_CONFIGURED' })
    }
    const started = Date.now()
    const model = this.model()
    const chat = await chatCompletions({
      baseUrl: this.baseUrl(),
      model,
      messages: buildScriptLlmMessages(ctx),
      timeoutMs: this.timeoutMs(),
      jsonMode: true,
      maxTokens: 4096,
    })
    const validated = validateLlmScriptContent(chat.content)
    const durationMs = Date.now() - started
    return {
      script: validated.script,
      hooks: validated.hooks,
      bestHook: validated.bestHook,
      provider: this.name,
      model: chat.model || model,
      tokensIn: chat.tokensIn,
      tokensOut: chat.tokensOut,
      durationMs,
      fallbackTrail: [{ provider: this.name, model: chat.model || model, status: 'READY', durationMs }],
    }
  }
}
