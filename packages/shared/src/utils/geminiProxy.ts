const DEFAULT_PROXY_ENDPOINT =
  (import.meta.env.VITE_GEMINI_PROXY_ENDPOINT &&
    import.meta.env.VITE_GEMINI_PROXY_ENDPOINT.trim()) ||
  '/.netlify/functions/gemini-proxy';

export interface GeminiProxyOptions {
  modelOverride?: string | null;
  signal?: AbortSignal;
}

export interface GeminiProxyResponse {
  text: string;
  modelName: string;
  apiVersion: string;
}

export const callGeminiProxy = async (
  prompt: string,
  options: GeminiProxyOptions = {},
): Promise<GeminiProxyResponse> => {
  const response = await fetch(DEFAULT_PROXY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      modelOverride: options.modelOverride ?? null,
    }),
    signal: options.signal,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as Record<string, unknown>).error === 'string'
        ? ((payload as Record<string, unknown>).error as string)
        : `Gemini proxy request failed with status ${response.status}.`;
    throw new Error(message);
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof (payload as Record<string, unknown>).text !== 'string'
  ) {
    throw new Error('Gemini proxy returned an unexpected response.');
  }

  const data = payload as Record<string, unknown>;
  return {
    text: data.text as string,
    modelName: typeof data.modelName === 'string' ? (data.modelName as string) : 'unknown',
    apiVersion: typeof data.apiVersion === 'string' ? (data.apiVersion as string) : 'unknown',
  };
};
