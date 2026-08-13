import { extractJsonObject, parseAndValidateScriptPack } from './scriptSchema.js'

export type ChatCompletionResult = {
  content: string
  model: string
  tokensIn: number
  tokensOut: number
}

/**
 * OpenAI-compatible chat completions (Ollama, OpenAI, etc.).
 */
export async function chatCompletions(input: {
  baseUrl: string
  apiKey?: string
  model: string
  messages: Array<{ role: string; content: string }>
  timeoutMs: number
}): Promise<ChatCompletionResult> {
  const base = input.baseUrl.replace(/\/$/, '')
  const url = base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`

  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (input.apiKey) headers.authorization = `Bearer ${input.apiKey}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), input.timeoutMs)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: 0.4,
        stream: false,
      }),
    })
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    throw Object.assign(
      new Error(aborted ? `llm_timeout:${input.timeoutMs}` : `llm_fetch_failed:${err instanceof Error ? err.message : String(err)}`),
      { code: aborted ? 'TIMEOUT' : 'LLM_FETCH' },
    )
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw Object.assign(new Error(`llm_http_${res.status}:${body.slice(0, 200)}`), { code: 'LLM_HTTP' })
  }

  const json = (await res.json()) as {
    model?: string
    choices?: Array<{ message?: { content?: string } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  const content = json.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string') {
    throw Object.assign(new Error('llm_empty_content'), { code: 'INVALID_SCRIPT' })
  }

  return {
    content,
    model: json.model || input.model,
    tokensIn: Number(json.usage?.prompt_tokens || 0),
    tokensOut: Number(json.usage?.completion_tokens || 0),
  }
}

export function validateLlmScriptContent(content: string) {
  return parseAndValidateScriptPack(extractJsonObject(content))
}
