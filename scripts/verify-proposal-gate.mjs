import { validateEditorProposal } from '../src/ai/proposalGate.js';

const packet = [{ url: 'https://example.com/source', title: 'Source' }];

const valid = validateEditorProposal({
  operation: 'CREATE_POST',
  proposal: {
    summary: 'ok',
    sources: [{ url: 'https://example.com/source' }],
    post: { status: 'READY', text: 'Draft' },
  },
  discoveredSources: packet,
});
if (!valid.valid) throw new Error('VALID_PROPOSAL_REJECTED');

const unknownSource = validateEditorProposal({
  operation: 'CREATE_POST',
  proposal: {
    sources: [{ url: 'https://evil.example/source' }],
    post: { status: 'READY', text: 'Draft' },
  },
  discoveredSources: packet,
});
if (unknownSource.valid || !unknownSource.errors.some((item) => item.startsWith('SOURCE_NOT_IN_RESEARCH_PACKET:'))) {
  throw new Error('UNKNOWN_SOURCE_ACCEPTED');
}

const blocked = validateEditorProposal({
  operation: 'CREATE_POST',
  proposal: { post: { status: 'BLOCKED', text: 'Недостаточно доказательств' }, sources: [] },
  discoveredSources: packet,
});
if (!blocked.valid) throw new Error('BLOCKED_POST_REJECTED');

const forbidden = validateEditorProposal({
  operation: 'MARKET_SCAN',
  proposal: { output: 'draft', publish: true },
  discoveredSources: packet,
});
if (forbidden.valid || !forbidden.errors.includes('MODEL_CANNOT_PUBLISH')) {
  throw new Error('PUBLISH_PERMISSION_LEAK');
}

console.log('AI proposal gate verification passed');
