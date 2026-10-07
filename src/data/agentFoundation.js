/**
 * FORDEX Agent Foundation
 *
 * Канонический контракт данных для будущих AI-агентов.
 * Агент может предлагать факты и изменения, но не меняет опубликованный
 * рейтинг напрямую: все изменения проходят evidence -> validation -> approval.
 */

export const AGENT_FOUNDATION_VERSION = '1.0';

export const evidenceTypes = [
  'COMPANY_FACT',
  'FUNDING_EVENT',
  'TRACTION_METRIC',
  'PRODUCT_LAUNCH',
  'PARTNERSHIP',
  'CUSTOMER_SIGNAL',
  'TEAM_CHANGE',
  'MARKET_SIGNAL',
  'NEWS_EVENT',
];

export const evidenceStatuses = ['PROPOSED', 'VERIFIED', 'CONFLICT', 'REJECTED', 'EXPIRED'];

export const agentRoles = [
  'ORCHESTRATOR',
  'RESEARCH',
  'EVIDENCE',
  'DATA',
  'RANKING',
  'NEWS',
  'VISUAL',
  'QUALITY',
  'PUBLISHER',
];

export const changeActions = ['CREATE', 'UPDATE', 'DELETE'];

export const approvalStates = ['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED'];

export const sourceReliability = {
  PRIMARY: 1,
  REGISTRY: 0.9,
  SECONDARY: 0.75,
  DISCOVERY: 0.55,
};

export function createEvidenceProposal({
  companyId,
  type,
  statement,
  source,
  sourceName,
  observedAt,
  confidence = 0,
  discoveredBy = 'RESEARCH',
  metadata = {},
}) {
  if (!companyId || !type || !statement || !source) {
    throw new Error('Evidence proposal requires companyId, type, statement and source');
  }

  return {
    id: 'evidence-' + companyId + '-' + Date.now(),
    companyId,
    type,
    statement,
    source,
    sourceName: sourceName || source,
    observedAt: observedAt || new Date().toISOString(),
    confidence: Math.max(0, Math.min(100, Number(confidence) || 0)),
    status: 'PROPOSED',
    discoveredBy,
    metadata,
  };
}

export function createChangeProposal({
  entityType,
  entityId,
  action = 'UPDATE',
  patch,
  evidenceIds = [],
  requestedBy = 'DATA',
  reason = '',
}) {
  if (!entityType || !entityId || !patch || typeof patch !== 'object') {
    throw new Error('Change proposal requires entityType, entityId and patch');
  }

  return {
    id: 'change-' + entityType.toLowerCase() + '-' + entityId + '-' + Date.now(),
    entityType,
    entityId,
    action,
    patch,
    evidenceIds,
    requestedBy,
    reason,
    approvalState: 'DRAFT',
    createdAt: new Date().toISOString(),
  };
}

export const agentPermissions = {
  RESEARCH: ['CREATE_EVIDENCE_PROPOSAL'],
  EVIDENCE: ['VERIFY_EVIDENCE', 'FLAG_CONFLICT'],
  DATA: ['CREATE_CHANGE_PROPOSAL', 'UPDATE_UNPUBLISHED_DATA'],
  RANKING: ['RECALCULATE_RANKING', 'CREATE_RANKING_SNAPSHOT'],
  NEWS: ['CREATE_ARTICLE_DRAFT', 'UPDATE_ARTICLE_DRAFT'],
  VISUAL: ['CREATE_ARTICLE_ASSET'],
  QUALITY: ['VALIDATE_EVIDENCE', 'VALIDATE_ARTICLE', 'BLOCK_PUBLICATION'],
  PUBLISHER: ['PUBLISH_APPROVED_CONTENT'],
  ORCHESTRATOR: ['RUN_WORKFLOW', 'DISPATCH_AGENT'],
};

export const forbiddenAgentActions = [
  'DIRECT_PUBLISHED_RANKING_EDIT',
  'DIRECT_SCORE_OVERRIDE',
  'PUBLISH_WITHOUT_EVIDENCE',
  'PUBLISH_CONFLICTED_FACT',
  'DELETE_SOURCE_HISTORY',
  'CHANGE_RANKING_FORMULA_WITHOUT_VERSION',
];

export const agentWorkflow = [
  'SCAN',
  'EXTRACT',
  'NORMALIZE',
  'VERIFY',
  'PROPOSE',
  'RECALCULATE',
  'DRAFT',
  'QUALITY_CHECK',
  'APPROVAL_GATE',
  'PUBLISH',
];

export const rankingSnapshot = {
  modelVersion: '1.1',
  source: 'rankingEngine',
  immutable: true,
  generatedBy: 'SYSTEM',
  generatedAt: null,
  changes: [],
};

export const agentControlPlane = {
  version: AGENT_FOUNDATION_VERSION,
  status: 'FOUNDATION',
  permissions: agentPermissions,
  forbiddenActions: forbiddenAgentActions,
  workflow: agentWorkflow,
  publicationRule: 'Only APPROVED proposals with valid evidence may become PUBLISHED.',
};
