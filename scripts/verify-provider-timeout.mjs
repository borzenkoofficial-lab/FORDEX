import assert from 'node:assert/strict';

const previousEnv = {
  FORDEX_ADMIN_TOKEN: process.env.FORDEX_ADMIN_TOKEN,
  ANYMODEL_API_KEY: process.env.ANYMODEL_API_KEY,
  FORDEX_AI_PROVIDER_TIMEOUT_MS: process.env.FORDEX_AI_PROVIDER_TIMEOUT_MS,
};
const originalFetch = globalThis.fetch;

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function fakeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    end(body) { this.body = body; },
  };
}

try {
  process.env.FORDEX_ADMIN_TOKEN = 'provider-timeout-verification-token-123456789';
  process.env.ANYMODEL_API_KEY = 'provider-timeout-test-key';
  process.env.FORDEX_AI_PROVIDER_TIMEOUT_MS = '50';

  const { default: handler } = await import('../api/ai/editor.js?verify-provider-timeout');

  let fetchCalled = false;
  globalThis.fetch = async (_url, options = {}) => {
    fetchCalled = true;
    assert.ok(options.signal instanceof AbortSignal, 'provider call must receive an AbortSignal');
    assert.equal(options.headers.Authorization, 'Bearer provider-timeout-test-key');
    return await new Promise((_resolve, reject) => {
      const abort = () => reject(new DOMException('Aborted', 'AbortError'));
      if (options.signal.aborted) return abort();
      options.signal.addEventListener('abort', abort, { once: true });
    });
  };

  const res = fakeResponse();
  await handler({
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + process.env.FORDEX_ADMIN_TOKEN,
      'x-real-ip': 'verify-provider-timeout-ip',
    },
    body: { objective: 'verify bounded provider requests', provider: 'anymodel' },
    socket: { remoteAddress: 'verify-provider-timeout-ip' },
  }, res);

  assert.ok(fetchCalled, 'provider request must have been started');
  assert.equal(res.statusCode, 504, 'a timed-out provider must return HTTP 504');
  const payload = JSON.parse(res.body);
  assert.equal(payload.error, 'MODEL_PROVIDER_TIMEOUT');
  assert.equal(payload.timeoutMs, 50);
  assert.equal(payload.provider, 'anymodel');
  assert.ok(!res.body.includes('provider-timeout-test-key'), 'provider key must not appear in the response');
  console.log('AI provider timeout verification passed');
} finally {
  globalThis.fetch = originalFetch;
  for (const [name, value] of Object.entries(previousEnv)) restoreEnv(name, value);
}
