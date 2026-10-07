import { AI_EDITOR_VERSION, createEditorPlan } from './aiEditor.js';

export const MODEL_GATEWAY_VERSION = '1.0';

export const MODEL_PROVIDERS = Object.freeze({
  ANYMODEL: 'anymodel',
  ASTRA: 'astra',
});

export function getModelConfig(env = import.meta?.env || {}) {
  return {
    provider: String(env.VITE_AI_PROVIDER || '').toLowerCase() || null,
    model: env.VITE_AI_MODEL || null,
    configured: Boolean(env.VITE_AI_BASE_URL && env.VITE_AI_MODEL),
  };
}

export function createModelRequest({ objective, companyId = null, context = {}, tools = [] }) {
  if (!objective) throw new Error('MODEL_OBJECTIVE_REQUIRED');
  const plan = createEditorPlan({ objective, companyId });
  return {
    version: MODEL_GATEWAY_VERSION,
    editorVersion: AI_EDITOR_VERSION,
    provider: null,
    model: null,
    objective,
    context,
    tools,
    plan: {
      type: plan.type,
      steps: plan.steps,
      permissions: plan.permissions,
    },
  };
}

export function validateModelResponse(response) {
  if (!response || typeof response !== 'object') return { valid:false, errors:['INVALID_RESPONSE'] };
  const errors = [];
  if (!response.output && !response.toolCalls) errors.push('EMPTY_MODEL_OUTPUT');
  if (response.publish === true) errors.push('MODEL_CANNOT_PUBLISH');
  if (response.overrideScore === true) errors.push('MODEL_CANNOT_OVERRIDE_SCORE');
  if (response.changeFormula === true) errors.push('MODEL_CANNOT_CHANGE_FORMULA');
  return { valid: errors.length === 0, errors };
}
