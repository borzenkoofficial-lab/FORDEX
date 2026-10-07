import { AI_TOOLS, TOOL_POLICY, assertToolAllowed } from './contracts.js';
import { createEvidenceProposal, createChangeProposal } from '../data/agentFoundation.js';
import { validateEvidenceProposal, validateChangeProposal, getRankingChange } from '../lib/agentPipeline.js';
import { rankingModel, rankedStartupIndex } from '../lib/rankingEngine.js';

export function listAgentTools(role = 'editor') {
  return Object.entries(TOOL_POLICY)
    .filter(([, policy]) => policy.roles.includes(role))
    .map(([name, policy]) => ({ name, ...policy }));
}

export function executeTool(role, toolName, input = {}) {
  assertToolAllowed(role, toolName);

  switch (toolName) {
    case AI_TOOLS.SEARCH_WEB:
      return { status: 'ADAPTER_REQUIRED', tool: toolName, query: input.query || '' };

    case AI_TOOLS.INSPECT_SOURCE:
      return { status: 'ADAPTER_REQUIRED', tool: toolName, source: input.source || null };

    case AI_TOOLS.CREATE_EVIDENCE: {
      const proposal = createEvidenceProposal(input);
      const validation = validateEvidenceProposal(proposal);
      return { status: validation.valid ? 'PROPOSED' : 'BLOCKED', proposal, validation };
    }

    case AI_TOOLS.PROPOSE_COMPANY_UPDATE: {
      if (!input.evidenceIds?.length) return { status: 'BLOCKED', reason: 'EVIDENCE_REQUIRED' };
      const proposal = createChangeProposal(input);
      const evidenceById = new Map((input.evidence || []).map((item) => [item.id, item]));
      const validation = validateChangeProposal(proposal, evidenceById);
      return { status: validation.valid ? 'READY_FOR_REVIEW' : 'BLOCKED', proposal, validation };
    }

    case AI_TOOLS.RECALCULATE_RANKING:
      return {
        status: 'DETERMINISTIC_ENGINE',
        tool: toolName,
        modelVersion: rankingModel.version,
        rankingStatus: rankingModel.status,
        changes: getRankingChange(input.previous || [], rankedStartupIndex),
        items: rankedStartupIndex.length,
      };

    case AI_TOOLS.CREATE_NEWS_DRAFT:
      if (!input.evidenceIds?.length) return { status: 'BLOCKED', reason: 'EVIDENCE_REQUIRED' };
      return {
        status: 'DRAFT_ONLY',
        tool: toolName,
        title: input.title || '',
        body: input.body || '',
        evidenceIds: input.evidenceIds,
        approvalState: 'READY_FOR_REVIEW',
      };

    case AI_TOOLS.REQUEST_VISUAL:
      return {
        status: 'REQUESTED',
        tool: toolName,
        prompt: input.prompt || '',
        reference: input.reference || null,
        approvalState: 'DRAFT',
      };

    case AI_TOOLS.RUN_QUALITY_CHECK: {
      const errors = [];
      if (input.requiresEvidence && !input.evidenceIds?.length) errors.push('EVIDENCE_REQUIRED');
      if (input.conflictedEvidenceIds?.length) errors.push('CONFLICTED_EVIDENCE');
      if (input.unverifiedFacts?.length) errors.push('UNVERIFIED_FACTS');
      if (input.article?.status === 'PUBLISHED' && !input.approved) errors.push('PUBLICATION_NOT_APPROVED');
      return { status: errors.length ? 'BLOCKED' : 'PASSED', errors };
    }

    default:
      throw new Error(`Unhandled AI tool: ${toolName}`);
  }
}

export { AI_TOOLS };
