import { validateEditorProposal } from '../../src/ai/proposalGate.js';
import { authorizeAdmin, enforceBodySize, enforceRateLimit } from '../../src/server/adminAuth.js';

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function parseOutput(output) {
  if (output && typeof output === 'object') return output;
  const source = String(output || '').trim();
  if (!source) return null;
  const fenced = source.match(/\`\`\`json\s*([\s\S]*?)\`\`\`/i);
  try { return JSON.parse(fenced?.[1] || source); } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  }

  if (!authorizeAdmin(req, res)) return;
  if (!enforceRateLimit(req, res, { scope: 'ai-proposal', limit: 60, windowMs: 10 * 60 * 1000 })) return;
  if (!enforceBodySize(req, res, 100 * 1024)) return;

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const proposal = parseOutput(body.output);
  const result = validateEditorProposal({
    operation: body.operation,
    proposal,
    discoveredSources: body.discoveredSources,
  });

  return json(res, result.valid ? 200 : 422, {
    status: result.valid ? 'PROPOSAL_ACCEPTED' : 'PROPOSAL_REJECTED',
    ...result,
  });
}
