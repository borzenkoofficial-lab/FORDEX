const ALLOWED_OPERATIONS = new Set(['MARKET_SCAN', 'COMPANY_RESEARCH', 'CREATE_POST']);

function asText(value) {
  return value == null ? '' : String(value).trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function validateEditorProposal({
  operation = '',
  proposal = null,
  discoveredSources = [],
} = {}) {
  const errors = [];
  const warnings = [];
  const normalizedOperation = asText(operation).toUpperCase();

  if (!ALLOWED_OPERATIONS.has(normalizedOperation)) errors.push('UNSUPPORTED_OPERATION');
  if (!proposal || typeof proposal !== 'object') errors.push('INVALID_PROPOSAL');

  const sources = Array.isArray(discoveredSources) ? discoveredSources : [];
  const allowedUrls = new Set(sources.map((source) => asText(source?.url)).filter(Boolean));

  const proposalSources = Array.isArray(proposal?.sources) ? proposal.sources : [];
  const proposalUrls = unique(proposalSources.map((source) => asText(source?.url || source)));

  for (const url of proposalUrls) {
    if (!allowedUrls.has(url)) errors.push('SOURCE_NOT_IN_RESEARCH_PACKET:' + url);
  }

  const post = proposal?.post;
  const postStatus = post && typeof post === 'object' ? asText(post.status).toUpperCase() : '';
  const postText = post && typeof post === 'object' ? asText(post.text) : asText(post);

  if (normalizedOperation === 'CREATE_POST') {
    if (!postStatus && !postText) errors.push('POST_MISSING');
    if (postStatus === 'BLOCKED' && proposalUrls.length > 0) {
      warnings.push('BLOCKED_POST_HAS_SOURCE_REFERENCES');
    }
    if (postStatus !== 'BLOCKED' && proposalUrls.length === 0) {
      errors.push('POST_REQUIRES_VERIFIED_SOURCE');
    }
  }

  if (proposal?.publish === true) errors.push('MODEL_CANNOT_PUBLISH');
  if (proposal?.overrideScore === true) errors.push('MODEL_CANNOT_OVERRIDE_SCORE');
  if (proposal?.changeFormula === true) errors.push('MODEL_CANNOT_CHANGE_FORMULA');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    operation: normalizedOperation,
    sourceCount: proposalUrls.length,
    approvalRequired: true,
    canPublish: false,
    canOverrideScore: false,
    canChangeFormula: false,
  };
}
