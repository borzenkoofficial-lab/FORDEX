import { dealRecords } from './deals.js';

export const dealRegistry = dealRecords.map((deal) => ({
  ...deal,
  entityId: deal.company.toLowerCase().replace(/[^a-z0-9а-я]+/gi, '-').replace(/^-|-$/g, ''),
  evidenceLevel: deal.verified ? 'SOURCE_CLAIMED' : 'RESEARCH',
}));

export const dealById = new Map(dealRegistry.map((deal) => [deal.id, deal]));

export const dealRegistryStats = {
  total: dealRegistry.length,
  verified: dealRegistry.filter((deal) => deal.verified).length,
  disclosedCapitalM: dealRegistry.reduce((sum, deal) => sum + (Number(deal.valueM) || 0), 0),
};
