const DEFAULT_MODELS = ['models/gemini-2.5-flash', 'models/gemini-1.5-flash'];
const API_VERSION_CANDIDATES = ['v1beta', 'v1'];
const MAX_RETRIES = 3;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeModelName = (model) =>
  model.startsWith('models/') ? model : `models/${model}`;

const parseOverride = (raw) => {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map(normalizeModelName);
};

const extractText = (payload) => {
  const parts =
    payload?.candidates?.[0]?.content?.parts ??
    payload?.candidates?.[0]?.candidates?.[0]?.content?.parts ??
    [];

  if (!Array.isArray(parts)) return null;

  const text = parts
    .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
    .filter((chunk) => chunk.length > 0)
    .join('\n')
    .trim();

  return text.length > 0 ? text : null;
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server is missing GEMINI_API_KEY.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON payload.' }),
    };
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Prompt is required.' }),
    };
  }

  const overrideModels = parseOverride(body.modelOverride);
  const modelCandidates = [...new Set([...overrideModels, ...DEFAULT_MODELS])];

  let lastError = null;

  for (const modelName of modelCandidates) {
    for (const apiVersion of API_VERSION_CANDIDATES) {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
        try {
          const url = `https://generativelanguage.googleapis.com/${apiVersion}/${modelName}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
            }),
          });

          const payload = await response.json().catch(() => null);
          const status = response.status;

          if (response.ok && payload) {
            const text = extractText(payload);
            if (text) {
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                  text,
                  modelName,
                  apiVersion,
                }),
              };
            }
            lastError = new Error('Gemini response did not contain text output.');
            break;
          }

          if (status === 429) {
            const waitMs = 1000 * Math.pow(2, attempt);
            await delay(waitMs);
            continue;
          }

          if (status === 503) {
            await delay(1000);
            break;
          }

          if (status === 404) {
            break;
          }

          if (status === 403) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({
                error: 'AI access is restricted or the API key is invalid. Please retry in a few minutes.',
              }),
            };
          }

          const message =
            (payload && payload.error && payload.error.message) ||
            `Gemini API returned status ${status}.`;
          lastError = new Error(message);
        } catch (error) {
          lastError = error;
        }
      }
    }
  }

  if (lastError) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: lastError instanceof Error ? lastError.message : 'Gemini proxy failed.' }),
    };
  }

  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: 'All Gemini model candidates failed to generate content.' }),
  };
};
