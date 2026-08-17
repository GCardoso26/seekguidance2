import type { ScriptGenerationContext } from '../types.js'
import type { ScriptProvider, ScriptProviderResult } from './ScriptProvider.js'
import { buildScriptLlmMessages } from './scriptPrompt.js'
import { chatCompletions, validateLlmScriptContent } from './openaiCompatibleChat.js'

export class GeminiScriptProvider implements ScriptProvider {
  name = 'gemini'

  status() {
    return this.apiKey() ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }

  private apiKey() {
    return (process.env.GEMINI_API_KEY || '').trim()
  }

  async generate(ctx: ScriptGenerationContext): Promise<ScriptProviderResult> {
    if (!this.apiKey()) {
      throw Object.assign(new Error('provider_not_configured:gemini'), { code: 'NOT_CONFIGURED' })
    }
    const started = Date.now()
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'
    const chat = await chatCompletions({
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: this.apiKey(),
      model,
      messages: buildScriptLlmMessages(ctx),
      timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS || 60000),
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

export class GroqScriptProvider implements ScriptProvider {
  name = 'groq'

  status() {
    return this.apiKey() ? ('READY' as const) : ('NOT_CONFIGURED' as const)
  }

  private apiKey() {
    return (process.env.GROQ_API_KEY || '').trim()
  }

  async generate(ctx: ScriptGenerationContext): Promise<ScriptProviderResult> {
    if (!this.apiKey()) {
      throw Object.assign(new Error('provider_not_configured:groq'), { code: 'NOT_CONFIGURED' })
    }
    const started = Date.now()
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
    const chat = await chatCompletions({
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: this.apiKey(),
      model,
      messages: buildScriptLlmMessages(ctx),
      timeoutMs: Number(process.env.GROQ_TIMEOUT_MS || 60000),
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
