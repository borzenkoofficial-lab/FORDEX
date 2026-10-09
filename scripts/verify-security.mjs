import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { authorizeAdmin, enforceBodySize, enforceRateLimit, isValidAdminToken } from '../src/server/adminAuth.js';

const environmentExample = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
const exampleToken = environmentExample.match(/^FORDEX_ADMIN_TOKEN=(.*)$/m)?.[1] || '';
assert.ok(exampleToken.length < 32, 'public example token must remain too short to authenticate if copied unchanged');

const token = 't'.repeat(48);
assert.equal(isValidAdminToken(token, token), true, 'valid long admin token must pass');
assert.equal(isValidAdminToken('x'.repeat(48), token), false, 'wrong admin token must fail');
assert.equal(isValidAdminToken('short', 'short'), false, 'short configured token must fail closed');
assert.equal(isValidAdminToken(token, ''), false, 'missing configured token must fail closed');

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

const previousToken = process.env.FORDEX_ADMIN_TOKEN;
process.env.FORDEX_ADMIN_TOKEN = token;
const acceptedResponse = fakeResponse();
assert.equal(authorizeAdmin({ headers: { authorization: 'Bearer ' + token } }, acceptedResponse), true);
const rejectedResponse = fakeResponse();
assert.equal(authorizeAdmin({ headers: { authorization: 'Bearer wrong' } }, rejectedResponse), false);
assert.equal(rejectedResponse.statusCode, 401);
if (previousToken === undefined) delete process.env.FORDEX_ADMIN_TOKEN;
else process.env.FORDEX_ADMIN_TOKEN = previousToken;

const missingTokenResponse = fakeResponse();
delete process.env.FORDEX_ADMIN_TOKEN;
assert.equal(authorizeAdmin({ headers: { authorization: 'Bearer ' + token }, socket: { remoteAddress: 'missing-secret-test-ip' } }, missingTokenResponse), false);
assert.equal(missingTokenResponse.statusCode, 503, 'admin API must fail closed without configured secret');
if (previousToken !== undefined) process.env.FORDEX_ADMIN_TOKEN = previousToken;

const bruteForceRequest = {
  headers: { authorization: 'Bearer incorrect-token', 'x-real-ip': 'security-brute-force-test-ip' },
  socket: { remoteAddress: 'security-brute-force-test-ip' },
};
for (let attempt = 0; attempt < 50; attempt += 1) {
  const attemptResponse = fakeResponse();
  authorizeAdmin(bruteForceRequest, attemptResponse);
}
const throttledAuthResponse = fakeResponse();
assert.equal(authorizeAdmin(bruteForceRequest, throttledAuthResponse), false);
assert.equal(throttledAuthResponse.statusCode, 429, 'admin login attempts must be throttled');

const limitResponse = fakeResponse();
const limitedReq = { headers: {}, socket: { remoteAddress: 'verify-security-limit-ip' } };
assert.equal(enforceRateLimit(limitedReq, limitResponse, { scope: 'verify-security', limit: 1, windowMs: 60000 }), true);
assert.equal(enforceRateLimit(limitedReq, limitResponse, { scope: 'verify-security', limit: 1, windowMs: 60000 }), false);
assert.equal(limitResponse.statusCode, 429);

const bodyResponse = fakeResponse();
assert.equal(enforceBodySize({ body: { large: 'x'.repeat(50) } }, bodyResponse, 10), false);
assert.equal(bodyResponse.statusCode, 413);

for (const file of ['editor', 'research', 'proposal']) {
  const source = await readFile(new URL('../api/ai/' + file + '.js', import.meta.url), 'utf8');
  assert.match(source, /authorizeAdmin\(req, res\)/, file + ' endpoint must require admin auth');
  assert.match(source, /enforceBodySize\(req, res/, file + ' endpoint must limit request body size');
  assert.match(source, /enforceRateLimit\(req, res/, file + ' endpoint must rate-limit requests');
}

const controlRoom = await readFile(new URL('../src/AgentControlRoom.jsx', import.meta.url), 'utf8');
const client = await readFile(new URL('../src/ai/runtimeClient.js', import.meta.url), 'utf8');
assert.match(controlRoom, /fordex-admin-session-token/, 'control room must store only a session token');
assert.match(controlRoom, /checkAdminToken/, 'control room must verify credentials with the API');
assert.match(client, /Authorization: 'Bearer ' \+ token/, 'AI client must send admin credentials');
console.log('Security verification passed: admin auth, fail-closed config, rate limits, and bounded bodies.');
