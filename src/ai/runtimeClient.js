export const AI_RUNTIME_CLIENT_VERSION = '1.0';

export async function getModelGatewayStatus({ signal } = {}) {
  const response = await fetch('/api/ai/editor', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  const payload = await readJson(response);
  if (!response.ok) throw new Error(payload?.error || 'MODEL_GATEWAY_STATUS_FAILED');
  return payload;
}

export async function runEditorModel({
  objective,
  companyId = null,
  context = {},
  provider = null,
  model = null,
  testKey = '',
  signal,
} = {}) {
  if (!objective?.trim()) throw new Error('MODEL_OBJECTIVE_REQUIRED');

  const response = await fetch('/api/ai/editor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(testKey?.trim() ? { 'X-FORDEX-Test-Key': testKey.trim() } : {}),
    },
    body: JSON.stringify({ objective, companyId, context, provider, model }),
    signal,
  });

  const payload = await readJson(response);
  if (!response.ok) {
    const error = new Error(payload?.error || 'MODEL_REQUEST_FAILED');
    error.status = response.status;
    error.detail = payload?.detail || null;
    throw error;
  }

  return {
    ...payload,
    output: normalizeGatewayOutput(payload?.output),
  };
}


export async function runResearchAdapter({
  objective = '',
  company = null,
  signal,
} = {}) {
  const response = await fetch('/api/ai/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ objective, company }),
    signal,
  });

  const payload = await readJson(response);
  if (!response.ok) {
    const error = new Error(payload?.error || 'RESEARCH_REQUEST_FAILED');
    error.status = response.status;
    throw error;
  }

  return payload;
}

function normalizeGatewayOutput(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(normalizeGatewayOutput).filter(Boolean).join('\\n');
  }
  if (typeof value === 'object') {
    for (const key of ['text', 'content', 'value', 'output_text']) {
      if (value[key] != null) {
        const text = normalizeGatewayOutput(value[key]);
        if (text) return text;
      }
    }
    try { return JSON.stringify(value); } catch { return ''; }
  }
  return String(value);
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error('INVALID_MODEL_GATEWAY_RESPONSE');
  }
}
