import { AI_TOOLS, TOOL_POLICY, JOB_TYPES } from '../src/ai/contracts.js';
import { createEditorPlan } from '../src/ai/aiEditor.js';

const plan = createEditorPlan({ objective: 'verification' });
const errors = [];

if (Object.keys(AI_TOOLS).length !== 8) errors.push('EXPECTED_8_AI_TOOLS');
for (const tool of Object.values(AI_TOOLS)) {
  if (!TOOL_POLICY[tool]?.roles?.length) errors.push('MISSING_POLICY:' + tool);
}
if (!Object.values(JOB_TYPES).includes(plan.type)) errors.push('INVALID_JOB_TYPE');
for (const required of ['search_web', 'inspect_source', 'create_evidence', 'propose_company_update', 'recalculate_ranking', 'create_news_draft', 'run_quality_check']) {
  if (!plan.steps.some((step) => step.tool === required)) errors.push('MISSING_STEP:' + required);
}
if (plan.permissions.canPublish) errors.push('EDITOR_CAN_PUBLISH');
if (plan.permissions.canOverrideScore) errors.push('EDITOR_CAN_OVERRIDE_SCORE');
if (plan.permissions.canChangeFormula) errors.push('EDITOR_CAN_CHANGE_FORMULA');
if (plan.permissions.canDeleteEvidence) errors.push('EDITOR_CAN_DELETE_EVIDENCE');
if (plan.permissions.canDeleteSourceHistory) errors.push('EDITOR_CAN_DELETE_SOURCE_HISTORY');

if (errors.length) {
  console.error('AI EDITOR VERIFY FAILED');
  errors.forEach((error) => console.error('- ' + error));
  process.exit(1);
}

console.log('AI EDITOR CONTRACT VERIFICATION PASSED');
console.log('tools:', Object.values(AI_TOOLS).length);
console.log('steps:', plan.steps.length);
