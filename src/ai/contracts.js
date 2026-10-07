export const AI_CONTRACT_VERSION = '1.0';

export const AI_TOOLS = Object.freeze({
  SEARCH_WEB: 'search_web',
  INSPECT_SOURCE: 'inspect_source',
  CREATE_EVIDENCE: 'create_evidence',
  PROPOSE_COMPANY_UPDATE: 'propose_company_update',
  RECALCULATE_RANKING: 'recalculate_ranking',
  CREATE_NEWS_DRAFT: 'create_news_draft',
  REQUEST_VISUAL: 'request_visual',
  RUN_QUALITY_CHECK: 'run_quality_check',
});

export const TOOL_POLICY = Object.freeze({
  search_web: { roles: ['research', 'evidence', 'editor'], mutates: false },
  inspect_source: { roles: ['research', 'evidence', 'editor'], mutates: false },
  create_evidence: { roles: ['evidence', 'editor'], mutates: false, requiresEvidence: false },
  propose_company_update: { roles: ['data', 'editor'], mutates: true, requiresEvidence: true },
  recalculate_ranking: { roles: ['ranking', 'editor'], mutates: false, deterministic: true },
  create_news_draft: { roles: ['news', 'editor'], mutates: false, requiresEvidence: true },
  request_visual: { roles: ['visual', 'editor'], mutates: false },
  run_quality_check: { roles: ['quality', 'editor'], mutates: false },
});

export const JOB_TYPES = Object.freeze({
  MARKET_SCAN: 'MARKET_SCAN',
  COMPANY_RESEARCH: 'COMPANY_RESEARCH',
  EVIDENCE_VERIFY: 'EVIDENCE_VERIFY',
  RANKING_REFRESH: 'RANKING_REFRESH',
  NEWSROOM_REFRESH: 'NEWSROOM_REFRESH',
  WEEKLY_DIGEST: 'WEEKLY_DIGEST',
});

export const JOB_STATES = Object.freeze({
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  WAITING_APPROVAL: 'WAITING_APPROVAL',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
});

export function createAgentJob({ type, objective, companyId = null }) {
  if (!Object.values(JOB_TYPES).includes(type)) throw new Error('Unknown job type');
  return { id: `job-${Date.now()}`, type, objective, companyId, state: JOB_STATES.QUEUED, createdAt: new Date().toISOString() };
}

export function assertToolAllowed(role, toolName) {
  const policy = TOOL_POLICY[toolName];
  if (!policy) throw new Error(`Unknown AI tool: ${toolName}`);
  if (!policy.roles.includes(role)) throw new Error(`Role ${role} cannot use ${toolName}`);
  return policy;
}
