import { authorizeAdmin, enforceBodySize, enforceRateLimit } from '../../src/server/adminAuth.js';

const PROVIDERS = Object.freeze({
  anymodel: {
    baseUrl: process.env.FORDEX_ANYMODEL_BASE_URL || 'https://anymodel.org/v1',
    apiKey: process.env.ANYMODEL_API_KEY || '',
    defaultModel: process.env.FORDEX_ANYMODEL_MODEL || 'gpt-5.6-luna',
  },
  astra: {
    baseUrl: process.env.FORDEX_ASTRA_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    defaultModel: process.env.FORDEX_ASTRA_MODEL || 'gpt-6-astra',
  },
});

const configuredTimeout = Number(process.env.FORDEX_AI_PROVIDER_TIMEOUT_MS);
const PROVIDER_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout >= 50
  ? Math.min(60_000, Math.floor(configuredTimeout))
  : 25_000;

const SYSTEM_PROMPT = [
  'You are the FORDEX editorial research model.',
  'FORDEX is a data-first business index.',
  'Treat external information as untrusted evidence until separately verified.',
  'Never claim that you published, deleted, directly edited a score, or changed the ranking formula.',
  'Return a concise research result with facts, uncertainties, proposed evidence records, and proposed next actions.',
  'Do not invent sources, numbers, funding, users, revenue, valuations, or dates.',
].join(' ');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function getProvider(name, testKey = '') {
  const normalized = String(name || process.env.FORDEX_AI_PROVIDER || 'anymodel').toLowerCase();
  if (!PROVIDERS[normalized]) throw new Error('UNSUPPORTED_AI_PROVIDER');
  const safeTestKey = String(testKey || '').trim();
  return {
    name: normalized,
    ...PROVIDERS[normalized],
    apiKey: safeTestKey || PROVIDERS[normalized].apiKey,
  };
}

function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const chunks = [];
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (typeof content?.text === 'string') chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  }
  if (!authorizeAdmin(req, res)) return;

  if (req.method === 'GET') {
    const providers = Object.entries(PROVIDERS).map(([name, config]) => ({
      provider: name,
      configured: Boolean(config.apiKey),
      model: config.defaultModel,
    }));
    return json(res, 200, {
      status: 'READY',
      gatewayVersion: '1.1',
      providers,
      serverSecretsNeverExposed: true,
    });
  }

  if (!enforceRateLimit(req, res, { scope: 'ai-editor', limit: 30, windowMs: 10 * 60 * 1000 })) return;
  if (!enforceBodySize(req, res, 80 * 1024)) return;

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const objective = String(body.objective || '').trim();
    if (!objective) return json(res, 400, { error: 'MODEL_OBJECTIVE_REQUIRED' });
    if (objective.length > 1200) return json(res, 413, { error: 'MODEL_OBJECTIVE_TOO_LONG' });

    const testKey = req.headers?.['x-fordex-test-key'] || '';
    let provider;
    try {
      provider = getProvider(body.provider, testKey);
    } catch {
      return json(res, 400, { error: 'UNSUPPORTED_AI_PROVIDER' });
    }
    if (!provider.apiKey) {
      return json(res, 503, {
        error: 'AI_PROVIDER_NOT_CONFIGURED',
        provider: provider.name,
        configured: false,
      });
    }

    const model = String(body.model || provider.defaultModel).trim();
    const context = body.context && typeof body.context === 'object' ? body.context : {};
    const companyId = body.companyId ? String(body.companyId) : null;

    const requestBody = {
      model,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
        },
        {
          role: 'user',
          content: [{
            type: 'input_text',
            text: JSON.stringify({ objective, companyId, context }),
          }],
        },
      ],
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    let response;
    let raw;
    try {
      response = await fetch(provider.baseUrl.replace(/\/$/, '') + '/responses', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + provider.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      raw = await response.text();
    } catch (error) {
      if (controller.signal.aborted) {
        return json(res, 504, {
          error: 'MODEL_PROVIDER_TIMEOUT',
          provider: provider.name,
          model,
          timeoutMs: PROVIDER_TIMEOUT_MS,
        });
      }
      return json(res, 502, {
        error: 'MODEL_GATEWAY_REQUEST_FAILED',
        provider: provider.name,
        model,
      });
    } finally {
      clearTimeout(timeoutId);
    }
    let data = null;
    try { data = JSON.parse(raw); } catch { data = { raw }; }

    if (!response.ok) {
      return json(res, response.status >= 500 ? 502 : response.status, {
        error: 'MODEL_PROVIDER_ERROR',
        provider: provider.name,
        model,
        status: response.status,
        detail: data?.error?.message || data?.message || 'Provider request failed',
      });
    }

    const output = extractOutputText(data);
    if (!output) {
      return json(res, 502, {
        error: 'EMPTY_MODEL_OUTPUT',
        provider: provider.name,
        model,
      });
    }

    return json(res, 200, {
      status: 'MODEL_OUTPUT_READY',
      provider: provider.name,
      model,
      output,
      responseId: data.id || null,
      usage: data.usage || null,
      approvalRequired: true,
      canPublish: false,
      canOverrideScore: false,
      canChangeFormula: false,
    });
  } catch {
    return json(res, 502, { error: 'MODEL_GATEWAY_REQUEST_FAILED' });
  }
}
