import { companyRegistry } from './companyRegistry';

export const evidenceRegistry = companyRegistry.flatMap((company) => {
  const evidenceText = company.evidence || company.traction || company.description;
  if (!evidenceText && !company.source) return [];

  return [{
    id: company.id + '-primary',
    companyId: company.id,
    companyName: company.name,
    evidenceType: company.evidence ? 'OBSERVED_EVIDENCE' : company.traction ? 'BUSINESS_SIGNAL' : 'PROFILE',
    statement: evidenceText,
    source: company.source ?? null,
    sourceName: company.sourceName ?? company.name,
    lastVerified: company.lastVerified ?? null,
    verificationLevel: company.verificationLevel ?? 'RESEARCH',
  }];
});

export const evidenceByCompanyId = evidenceRegistry.reduce((map, record) => {
  const current = map.get(record.companyId) || [];
  current.push(record);
  map.set(record.companyId, current);
  return map;
}, new Map());

export const evidenceRegistryStats = {
  total: evidenceRegistry.length,
  linkedCompanies: new Set(evidenceRegistry.map((item) => item.companyId)).size,
  sourceClaimed: evidenceRegistry.filter((item) => item.verificationLevel === 'SOURCE_CLAIMED').length,
  primarySource: evidenceRegistry.filter((item) => item.verificationLevel === 'PRIMARY_SOURCE').length,
  editorialScored: evidenceRegistry.filter((item) => item.verificationLevel === 'EDITORIAL_SCORED').length,
};
