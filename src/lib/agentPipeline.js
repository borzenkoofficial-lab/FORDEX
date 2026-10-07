import { companyRegistry } from '../data/companyRegistry.js';
import { evidenceRegistry } from '../data/evidenceRegistry.js';
import { editorialArticles } from '../data/articles.js';
import { rankedStartupIndex, rankingModel } from './rankingEngine.js';

const companyIds = new Set(companyRegistry.map((company) => company.id));

export function validateEvidenceProposal(proposal) {
  const errors = [];

  if (!proposal?.companyId || !companyIds.has(proposal.companyId)) errors.push('UNKNOWN_COMPANY');
  if (!proposal?.type) errors.push('MISSING_EVIDENCE_TYPE');
  if (!proposal?.statement) errors.push('MISSING_STATEMENT');
  if (!proposal?.source) errors.push('MISSING_SOURCE');
  if (!Number.isFinite(Number(proposal?.confidence))) errors.push('INVALID_CONFIDENCE');

  return { valid: errors.length === 0, errors };
}

export function validateChangeProposal(proposal, evidenceById = new Map()) {
  const errors = [];

  if (!proposal?.entityType || !proposal?.entityId) errors.push('MISSING_ENTITY');
  if (!proposal?.patch || typeof proposal.patch !== 'object') errors.push('MISSING_PATCH');
  if (!proposal?.evidenceIds?.length) errors.push('MISSING_EVIDENCE');

  for (const evidenceId of proposal?.evidenceIds || []) {
    const evidence = evidenceById.get(evidenceId);
    if (!evidence) errors.push('UNKNOWN_EVIDENCE:' + evidenceId);
    else if (evidence.status === 'CONFLICT' || evidence.status === 'REJECTED') {
      errors.push('UNUSABLE_EVIDENCE:' + evidenceId);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function buildAgentControlSnapshot() {
  return {
    foundationVersion: '1.0',
    companies: companyRegistry.length,
    existingEvidence: evidenceRegistry.length,
    publishedArticles: editorialArticles.length,
    rankedCompanies: rankedStartupIndex.length,
    rankingModelVersion: rankingModel.version,
    rankingStatus: rankingModel.status,
    publicationGate: {
      evidenceRequired: true,
      conflictBlocksPublication: true,
      rankingFormulaAgentWritable: false,
      humanApprovalRequired: true,
    },
  };
}

export function getRankingChange(previous = [], current = rankedStartupIndex) {
  const previousById = new Map(previous.map((item) => [item.id, item.rank]));
  return current.map((item) => ({
    companyId: item.id,
    name: item.name,
    rank: item.rank,
    previousRank: previousById.get(item.id) ?? item.previousRank ?? null,
    delta: previousById.has(item.id)
      ? previousById.get(item.id) - item.rank
      : null,
    score: item.score,
  }));
}
