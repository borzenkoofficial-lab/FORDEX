import { createModelRequest, getModelConfig, validateModelResponse } from '../src/ai/modelGateway.js';

const request = createModelRequest({ objective: 'FORDEX market scan' });
if (!request.plan?.steps?.length) throw new Error('MODEL_REQUEST_HAS_NO_PLAN');
if (request.provider !== 'anymodel') throw new Error('DEFAULT_PROVIDER_INVALID');
if (request.model !== 'gpt-5.6-luna') throw new Error('DEFAULT_ANYMODEL_MODEL_INVALID');
if (request.security.canPublish) throw new Error('MODEL_CAN_PUBLISH');
if (request.security.canOverrideScore) throw new Error('MODEL_CAN_OVERRIDE_SCORE');
if (request.security.canChangeFormula) throw new Error('MODEL_CAN_CHANGE_FORMULA');

const astra = getModelConfig({ OPENAI_API_KEY: 'test-key' }, 'astra');
if (!astra.configured || astra.model !== 'gpt-6-astra') throw new Error('ASTRA_CONFIG_FAILED');

const anymodel = getModelConfig({ ANYMODEL_API_KEY: 'test-key' }, 'anymodel');
if (!anymodel.configured || anymodel.model !== 'gpt-5.6-luna') throw new Error('ANYMODEL_CONFIG_FAILED');

const valid = validateModelResponse({ output: 'draft' });
if (!valid.valid) throw new Error('VALID_RESPONSE_REJECTED');

const invalid = validateModelResponse({ output: 'draft', publish: true });
if (invalid.valid || !invalid.errors.includes('MODEL_CANNOT_PUBLISH')) {
  throw new Error('PUBLISH_GUARD_FAILED');
}

console.log('Model gateway verification passed');
