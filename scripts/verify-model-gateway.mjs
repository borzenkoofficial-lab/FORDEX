import { createModelRequest, validateModelResponse } from '../src/ai/modelGateway.js';

const request = createModelRequest({ objective: 'FORDEX market scan' });
if (!request.plan?.steps?.length) throw new Error('MODEL_REQUEST_HAS_NO_PLAN');
if (request.plan.permissions.canPublish) throw new Error('MODEL_CAN_PUBLISH');
if (request.plan.permissions.canOverrideScore) throw new Error('MODEL_CAN_OVERRIDE_SCORE');
if (request.plan.permissions.canChangeFormula) throw new Error('MODEL_CAN_CHANGE_FORMULA');

const valid = validateModelResponse({ output: 'draft' });
if (!valid.valid) throw new Error('VALID_RESPONSE_REJECTED');
const invalid = validateModelResponse({ output: 'draft', publish: true });
if (invalid.valid || !invalid.errors.includes('MODEL_CANNOT_PUBLISH')) throw new Error('PUBLISH_GUARD_FAILED');

console.log('Model gateway verification passed');
