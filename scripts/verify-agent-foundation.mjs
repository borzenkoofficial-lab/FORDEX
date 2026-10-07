import { companyRegistry } from '../src/data/companyRegistry.js';
import { evidenceRegistry } from '../src/data/evidenceRegistry.js';
import { editorialArticles } from '../src/data/articles.js';
import { rankedStartupIndex, rankingModel } from '../src/lib/rankingEngine.js';
import {
  agentRoles,
  agentPermissions,
  forbiddenAgentActions,
  agentWorkflow,
  evidenceTypes,
  approvalStates,
} from '../src/data/agentFoundation.js';
import { buildAgentControlSnapshot } from '../src/lib/agentPipeline.js';

const fail = (message) => {
  console.error('AGENT FOUNDATION VERIFY FAILED:', message);
  process.exit(1);
};

if (!companyRegistry.length) fail('company registry is empty');
if (!evidenceRegistry.length) fail('evidence registry is empty');
if (!editorialArticles.length) fail('published editorial layer is empty');
if (!rankedStartupIndex.length) fail('ranking is empty');

if (new Set(agentRoles).size !== agentRoles.length) fail('duplicate agent role');
if (new Set(evidenceTypes).size !== evidenceTypes.length) fail('duplicate evidence type');
if (new Set(approvalStates).size !== approvalStates.length) fail('duplicate approval state');
if (new Set(agentWorkflow).size !== agentWorkflow.length) fail('duplicate workflow step');

for (const role of agentRoles) {
  if (!agentPermissions[role]) fail('missing permissions for ' + role);
}

const requiredForbidden = [
  'DIRECT_PUBLISHED_RANKING_EDIT',
  'DIRECT_SCORE_OVERRIDE',
  'PUBLISH_WITHOUT_EVIDENCE',
  'PUBLISH_CONFLICTED_FACT',
  'CHANGE_RANKING_FORMULA_WITHOUT_VERSION',
];

for (const action of requiredForbidden) {
  if (!forbiddenAgentActions.includes(action)) fail('missing forbidden action ' + action);
}

if (rankingModel.status !== 'PUBLIC BETA') fail('unexpected ranking model status');
if (rankingModel.version !== '1.0') fail('unexpected ranking model version');

for (const evidence of evidenceRegistry) {
  if (!companyRegistry.some((company) => company.id === evidence.companyId)) {
    fail('orphan evidence: ' + evidence.id);
  }
}

const snapshot = buildAgentControlSnapshot();

if (snapshot.publicationGate.evidenceRequired !== true) fail('evidence gate disabled');
if (snapshot.publicationGate.conflictBlocksPublication !== true) fail('conflict gate disabled');
if (snapshot.publicationGate.rankingFormulaAgentWritable !== false) fail('ranking formula is agent-writable');
if (snapshot.publicationGate.humanApprovalRequired !== true) fail('human approval gate disabled');

console.log(
  'Agent foundation verified:',
  snapshot.companies, 'companies ·',
  snapshot.existingEvidence, 'evidence ·',
  snapshot.publishedArticles, 'published articles ·',
  snapshot.rankedCompanies, 'ranked companies ·',
  'model', snapshot.rankingModelVersion
);
