import { AI_TOOLS, TOOL_POLICY, JOB_TYPES } from '../src/ai/contracts.js';
import { createEditorPlan } from '../src/ai/aiEditor.js';

const plan = createEditorPlan({ objective: 'verification' });
if (plan.permissions.canPublish || plan.permissions.canOverrideScore || plan.permissions.canChangeFormula) {
  throw new Error('AI Editor permissions are too broad');
}
for (const tool of Object.values(AI_TOOLS)) {
  if (!TOOL_POLICY[tool]) throw new Error(`Missing policy for ${tool}`);
  if (!TOOL_POLICY[tool].roles?.length) throw new Error(`No roles for ${tool}`);
}
if (!Object.values(JOB_TYPES).includes(plan.type)) throw new Error('Invalid editor job type');
for (const required of ['create_evidence', 'recalculate_ranking', 'run_quality_check']) {
  if (!plan.steps.some((step) => step.tool === required)) throw new Error(`Missing step ${required}`);
}
console.log('AI Editor contract verification passed');
