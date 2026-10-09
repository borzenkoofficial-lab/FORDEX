import { createHash, timingSafeEqual } from 'node:crypto';

const rateBuckets = new Map();

function respond(res, status, body, headers = {}) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(JSON.stringify(body));
}

export function isValidAdminToken(candidate, configuredToken = process.env.FORDEX_ADMIN_TOKEN) {
  const expected = String(configuredToken || '');
  const supplied = String(candidate || '');
  if (expected.length < 32 || supplied.length === 0) return false;

  const expectedDigest = createHash('sha256').update(expected, 'utf8').digest();
  const suppliedDigest = createHash('sha256').update(supplied, 'utf8').digest();
  return timingSafeEqual(expectedDigest, suppliedDigest);
}

export function authorizeAdmin(req, res) {
  if (!enforceRateLimit(req, res, { scope: 'admin-auth', limit: 50, windowMs: 10 * 60 * 1000 })) return false;

  const configured = String(process.env.FORDEX_ADMIN_TOKEN || '');
  if (configured.length < 32) {
    respond(res, 503, { error: 'ADMIN_ACCESS_NOT_CONFIGURED' });
    return false;
  }

  const authorization = String(req.headers?.authorization || '');
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!isValidAdminToken(match?.[1], configured)) {
    respond(res, 401, { error: 'ADMIN_AUTH_REQUIRED' });
    return false;
  }
  return true;
}

export function enforceRateLimit(req, res, { scope, limit, windowMs }) {
  const now = Date.now();
  const platformAddress = String(req.headers?.['x-vercel-forwarded-for'] || req.headers?.['x-real-ip'] || '').split(',')[0].trim();
  const forwardedChain = String(req.headers?.['x-forwarded-for'] || '').split(',').map((item) => item.trim()).filter(Boolean);
  const address = platformAddress || forwardedChain.at(-1) || req.socket?.remoteAddress || 'unknown';
  const key = String(scope) + ':' + address;
  const current = rateBuckets.get(key);

  if (rateBuckets.size > 2000) {
    for (const [storedKey, bucket] of rateBuckets) {
      if (now - bucket.startedAt >= bucket.windowMs) rateBuckets.delete(storedKey);
    }
  }

  if (!current || now - current.startedAt >= windowMs) {
    rateBuckets.set(key, { startedAt: now, windowMs, count: 1 });
    return true;
  }

  if (current.count >= limit) {
    const retrySeconds = Math.max(1, Math.ceil((windowMs - (now - current.startedAt)) / 1000));
    respond(res, 429, { error: 'RATE_LIMITED', retryAfterSeconds: retrySeconds }, { 'Retry-After': String(retrySeconds) });
    return false;
  }

  current.count += 1;
  return true;
}

export function enforceBodySize(req, res, maxBytes) {
  let serialized;
  try {
    serialized = JSON.stringify(req.body ?? {});
  } catch {
    respond(res, 400, { error: 'INVALID_REQUEST_BODY' });
    return false;
  }

  if (Buffer.byteLength(serialized, 'utf8') > maxBytes) {
    respond(res, 413, { error: 'REQUEST_BODY_TOO_LARGE', maxBytes });
    return false;
  }
  return true;
}
