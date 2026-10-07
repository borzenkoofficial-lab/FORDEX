import { AI_EDITOR_VERSION, createEditorPlan } from './aiEditor.js';

export const MODEL_GATEWAY_VERSION = '1.1';

export const MODEL_PROVIDERS = Object.freeze({
  ANYMODEL: 'anymodel',
  ASTRA: 'astra',
});

const DEFAULT_MODELS = Object.freeze({
  anymodel: 'gpt-5.6-luna',
  astra: 'gpt-6-astra',
});

export function getModelConfig(env = {}, provider = null) {
  const normalizedProvider = String(
    provider || env.FORDEX_AI_PROVIDER || env.VITE_AI_PROVIDER || 'anymodel',
  ).toLowerCase();

  if (!MODEL_PROVIDERS[normalizedProvider.toUpperCase()]) {
    throw new Error('UNSUPPORTED_AI_PROVIDER');
  }

  const model = env.FORDEX_AI_MODEL
    || env[`FORDEX_${normalizedProvider.toUpperCase()}_MODEL`]
    || env.VITE_AI_MODEL
    || DEFAULT_MODELS[normalizedProvider];

  return {
    provider: normalizedProvider,
    model,
    configured: Boolean(
      (env.ANYMODEL_API_KEY && normalizedProvider === 'anymodel')
      || (env.OPENAI_API_KEY && normalizedProvider === 'astra')
    ),
  };
}

export function createModelRequest({
  objective,
  companyId = null,
  context = {},
  tools = [],
  provider = null,
  model = null,
  env = {},
} = {}) {
  if (!objective) throw new Error('MODEL_OBJECTIVE_REQUIRED');

  const config = getModelConfig(env, provider);
  const plan = createEditorPlan({ objective, companyId });

  return {
    version: MODEL_GATEWAY_VERSION,
    editorVersion: AI_EDITOR_VERSION,
    provider: config.provider,
    model: model || config.model,
    objective,
    context,
    tools,
    plan: {
      type: plan.type,
      steps: plan.steps,
      permissions: plan.permissions,
    },
    security: {
      serverSideExecutionRequired: true,
      approvalRequired: true,
      canPublish: false,
      canOverrideScore: false,
      canChangeFormula: false,
    },
  };
}

export function validateModelResponse(response) {
  if (!response || typeof response !== 'object') {
    return { valid: false, errors: ['INVALID_RESPONSE'] };
  }

  const errors = [];
  if (!response.output && !response.toolCalls) errors.push('EMPTY_MODEL_OUTPUT');
  if (response.publish === true) errors.push('MODEL_CANNOT_PUBLISH');
  if (response.overrideScore === true) errors.push('MODEL_CANNOT_OVERRIDE_SCORE');
  if (response.changeFormula === true) errors.push('MODEL_CANNOT_CHANGE_FORMULA');

  return { valid: errors.length === 0, errors };
}
