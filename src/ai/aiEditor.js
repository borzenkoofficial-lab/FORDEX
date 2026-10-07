import { JOB_TYPES, createAgentJob } from './contracts.js';
import { executeTool } from './toolGateway.js';

export const AI_EDITOR_VERSION = '1.1';

export function createEditorPlan({ objective, companyId = null }) {
  const type = companyId ? JOB_TYPES.COMPANY_RESEARCH : JOB_TYPES.MARKET_SCAN;
  const job = createAgentJob({ type, objective, companyId });

  return {
    ...job,
    permissions: {
      canPublish: false,
      canOverrideScore: false,
      canChangeFormula: false,
      canDeleteEvidence: false,
      canDeleteSourceHistory: false,
    },
    steps: [
      { id: 'research', tool: 'search_web', role: 'research' },
      { id: 'inspect', tool: 'inspect_source', role: 'evidence' },
      { id: 'evidence', tool: 'create_evidence', role: 'evidence' },
      { id: 'update', tool: 'propose_company_update', role: 'data' },
      { id: 'ranking', tool: 'recalculate_ranking', role: 'ranking' },
      { id: 'news', tool: 'create_news_draft', role: 'news' },
      { id: 'quality', tool: 'run_quality_check', role: 'quality' },
    ],
  };
}

export function executeEditorStep(step, input = {}) {
  return executeTool(step.role, step.tool, input);
}
