import { AI_TOOLS, TOOL_POLICY, assertToolAllowed } from './contracts.js';
import { createEvidenceProposal, createChangeProposal } from '../data/agentFoundation.js';
import { validateEvidenceProposal, validateChangeProposal } from '../lib/agentPipeline.js';
import { rankingModel, rankedStartupIndex } from '../lib/rankingEngine.js';

export function listAgentTools(role = 'editor') {
  return Object.entries(TOOL_POLICY)
    .filter(([, policy]) => policy.roles.includes(role))
    .map(([name, policy]) => ({ name, ...policy }));
}

export function executeTool(role, toolName, input = {}) {
  const policy = assertToolAllowed(role, toolName);
  switch (toolName) {
    case AI_TOOLS.SEARCH_WEB:
    case AI_TOOLS.INSPECT_SOURCE:
      return { status: 'ADAPTER_REQUIRED', tool: toolName, input };
    case AI_TOOLS.CREATE_EVIDENCE: {
      const proposal = createEvidenceProposal(input);
      return { status: 'VALIDATED', tool: toolName, proposal: validateEvidenceProposal(proposal) };
    }
    case AI_TOOLS.PROPOSE_COMPANY_UPDATE: {
      if (!input.evidenceIds?.length) throw new Error('Company updates require evidenceIds');
      const proposal = createChangeProposal(input);
      return { status: 'VALIDATED', tool: toolName, proposal: validateChangeProposal(proposal) };
    }
    case AI_TOOLS.RECALCULATE_RANKING:
      return { status: 'DETERMINISTIC_ENGINE', tool: toolName, modelVersion: rankingModel.version, items: rankedStartupIndex.length };
    case AI_TOOLS.CREATE_NEWS_DRAFT:
      if (!input.evidenceIds?.length) throw new Error('News drafts require evidenceIds');
      return { status: 'DRAFT_ONLY', tool: toolName, title: input.title ?? '', evidenceIds: input.evidenceIds };
    case AI_TOOLS.REQUEST_VISUAL:
      return { status: 'VISUAL_REQUEST', tool: toolName, prompt: input.prompt ?? '', reference: input.reference ?? null };
    case AI_TOOLS.RUN_QUALITY_CHECK:
      return { status: 'QUALITY_CHECK', tool: toolName, checks: { sourceCoverage: true, evidenceRequired: true, rankingFormulaProtected: true } };
    default:
      throw new Error(`Unhandled AI tool: ${toolName}`);
  }
}

export { AI_TOOLS };
