// Only free endpoints. Never substitute a paid model without owner approval.
export const freeModels = ['qwen/qwen3.8-27b:free', 'google/gemma-4-31b-it:free', 'openrouter/free'] as const;
export class ModelUnavailable extends Error {
  status: number;
  retryAfter: number;
  constructor(status: number, retryAfter = 30) { super('AI service unavailable'); this.status = status; this.retryAfter = retryAfter; }
}

export async function freeCompletion(key: string, messages: { role: string; content: string }[], signal: AbortSignal, fetcher: typeof fetch = fetch) {
  for (const model of freeModels) {
    if (signal.aborted) throw new ModelUnavailable(503);
    try {
      const response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://astroais.app', 'X-Title': 'Astrois' },
        body: JSON.stringify({ model, max_tokens: 900, temperature: 0.65, reasoning: { enabled: false }, provider: { allow_fallbacks: true, max_price: { prompt: 0, completion: 0 } }, messages }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(18000)]),
      });
      // Switching models cannot fix credentials, account quota, or privacy settings.
      if ([401, 402, 403].includes(response.status) || (response.status === 429 && response.headers.has('x-ratelimit-limit'))) {
        throw new ModelUnavailable(response.status, Math.min(300, Math.max(1, Number(response.headers.get('retry-after')) || 30)));
      }
      if (!response.ok) continue;
      const body = await response.json() as { error?: unknown; choices?: { message?: { content?: string; refusal?: string }; finish_reason?: string }[] };
      const choice = body.choices?.[0];
      // A content refusal is not a service outage and must not trigger safety bypass.
      if (choice?.finish_reason === 'content_filter' || choice?.message?.refusal) return 'I can help you explore this safely, but I cannot provide that kind of answer. Tell me what you are trying to understand.';
      const reply = choice?.message?.content?.trim();
      if (!body.error && reply && choice?.finish_reason === 'stop') return reply;
    } catch (error) {
      if (error instanceof ModelUnavailable) throw error;
      if (signal.aborted) throw new ModelUnavailable(503);
      // A timeout, network failure, malformed or incomplete reply tries the next free model.
    }
  }
  throw new ModelUnavailable(503);
}
