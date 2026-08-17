import type { ScriptGenerationContext } from '../types.js'
import type { ScriptProvider, ScriptProviderResult } from './ScriptProvider.js'
import { buildScriptLlmMessages } from './scriptPrompt.js'
import { chatCompletions, validateLlmScriptContent } from './openaiCompatibleChat.js'

/**
 * Remote OpenAI-compatible chat (OpenAI, Groq, etc.).
 *
 * Env: SCRIPT_LLM_BASE_URL or OPENAI_BASE_URL,
 *      SCRIPT_LLM_API_KEY or OPENAI_API_KEY,
 *      SCRIPT_LLM_MODEL or OPENAI_MODEL,
 *      SCRIPT_LLM_TIMEOUT_MS
 */
export class ApiScriptProvider implements ScriptProvider {
  name = 'openai_compatible'

  status() {
    return this.apiKey() ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }

  private apiKey(): string {
    return (process.env.SCRIPT_LLM_API_KEY || process.env.OPENAI_API_KEY || '').trim()
  }

  private baseUrl(): string {
    return (
      process.env.SCRIPT_LLM_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      'https://api.openai.com'
    ).replace(/\/$/, '')
  }

  private model(): string {
    return process.env.SCRIPT_LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini'
  }

  private timeoutMs(): number {
    const n = Number(process.env.SCRIPT_LLM_TIMEOUT_MS || process.env.OLLAMA_TIMEOUT_MS || 60000)
    return Number.isFinite(n) && n > 0 ? n : 60000
  }

  async generate(ctx: ScriptGenerationContext): Promise<ScriptProviderResult> {
    if (this.status() === 'NOT_CONFIGURED') {
      throw Object.assign(new Error('provider_not_configured:openai_compatible'), {
        code: 'NOT_CONFIGURED',
      })
    }
    const started = Date.now()
    const model = this.model()
    const chat = await chatCompletions({
      baseUrl: this.baseUrl(),
      apiKey: this.apiKey(),
      model,
      messages: buildScriptLlmMessages(ctx),
      timeoutMs: this.timeoutMs(),
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
