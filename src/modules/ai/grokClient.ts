import axios from 'axios'
import { env } from '../../config/env.js'
import { AIError } from '../../utils/ApiError.js'

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GrokResult {
  content: string
  tokenUsage?: number
}

/**
 * Thin wrapper around the chat-completions endpoint. Despite the "Grok"
 * naming throughout this codebase (env vars, file names), this project
 * actually calls Groq Cloud (console.groq.com) — a fast-inference host —
 * not xAI's Grok model at api.x.ai. Those are two different companies
 * with confusingly similar names; a Groq key (prefixed `gsk_`) will be
 * rejected if GROK_API_URL points at api.x.ai instead of
 * api.groq.com/openai/v1/chat/completions. Deliberately the only place
 * in the codebase that touches axios+this API directly — everything else
 * (context, prompt, memory) is built up before this is called.
 */
export async function callGrok(messages: GrokMessage[]): Promise<GrokResult> {
  try {
    const response = await axios.post(
      env.GROK_API_URL,
      { model: env.GROK_MODEL, messages, temperature: 0.6 },
      { headers: { Authorization: `Bearer ${env.GROK_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 30_000 }
    )

    const content = response.data?.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response from Grok')

    return { content, tokenUsage: response.data?.usage?.total_tokens }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      // Surface the upstream provider's actual error text (e.g. "Incorrect
      // API key provided", "model not found") instead of just a bare status
      // code — that one extra sentence is usually the entire diagnosis for
      // "AI Coach fails even though the key is set".
      const upstreamMessage =
        (err.response?.data as { error?: { message?: string } | string } | undefined)?.error
      const detail =
        typeof upstreamMessage === 'string'
          ? upstreamMessage
          : upstreamMessage?.message ?? err.message
      throw new AIError(`Grok request failed (${err.response?.status ?? 'network error'}): ${detail}`)
    }
    throw new AIError('Grok request failed')
  }
}
