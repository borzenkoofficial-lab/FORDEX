import { scoreWeights, startupRankings } from '../data/startups';

const MODEL_KEYS = [
  'businessTraction',
  'capitalFinancing',
  'growthMomentum',
  'technologyMoat',
  'marketOpportunity',
  'teamExecution',
];

const STAGE_BASE = {
  SEED: 54,
  'PRE-SERIES A': 64,
  'SERIES A': 72,
  'SERIES B': 78,
  'SERIES C': 82,
  GROWTH: 84,
};

const TAG_SCORE = {
  NEUROTECH: 95,
  DEEPTECH: 92,
  MEDTECH: 88,
  INDUSTRIAL: 86,
  'AI / AGENTS': 84,
  CONSUMER: 76,
};

const SECTOR_SCORE = {
  'AUTONOMOUS SYSTEMS': 91,
  'MEDTECH / AI': 89,
  NEUROTECH: 93,
  'FASHIONTECH / AI': 78,
  'ENTERPRISE AI': 86,
  'DEEPTECH / AI': 91,
  'AI / SAAS': 84,
  'FOODTECH / AI': 79,
  'GENERATIVE AI': 84,
  'INDUSTRIAL TECH': 87,
  'COMPUTER VISION': 89,
  'VIDEO ANALYTICS': 86,
  'CONVERSATIONAL AI': 83,
  'HEALTHCARE AI': 88,
  'DATA INFRASTRUCTURE': 89,
  'DOCUMENT AI': 85,
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value, digits = 1) => Number(value.toFixed(digits));

function tractionScore(item) {
  const stageBase = STAGE_BASE[item.stage] ?? 60;
  const evidence = String(item.traction || '').toLowerCase();
  const evidenceBonus =
    (evidence.includes('deployed') ? 5 : 0) +
    (evidence.includes('employees') ? 4 : 0) +
    (evidence.includes('products') ? 4 : 0) +
    (evidence.includes('transactions') ? 4 : 0) +
    (evidence.includes('international') ? 4 : 0) +
    (evidence.includes('portfolio') ? 3 : 0);
  return clamp(stageBase + evidenceBonus);
}

function capitalScore(item) {
  if (item.fundingM == null) return 38;
  return clamp(43 + 18 * Math.log10(Number(item.fundingM) + 1));
}

function momentumScore(item) {
  return clamp(40 + Number(item.momentum || 0) * 2.6);
}

function technologyScore(item) {
  const values = (item.tags || []).map((tag) => TAG_SCORE[tag] ?? 70);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 70;
}

function marketScore(item) {
  return SECTOR_SCORE[item.sector] ?? technologyScore(item);
}

function teamScore(item) {
  const stageBonus = {
    SEED: 2,
    'PRE-SERIES A': 4,
    'SERIES A': 7,
    'SERIES B': 9,
    'SERIES C': 11,
    GROWTH: 12,
  }[item.stage] ?? 4;
  return clamp((item.verified ? 76 : 58) + stageBonus);
}

function getComponentScores(item) {
  return {
    businessTraction: round(tractionScore(item), 0),
    capitalFinancing: round(capitalScore(item), 0),
    growthMomentum: round(momentumScore(item), 0),
    technologyMoat: round(technologyScore(item), 0),
    marketOpportunity: round(marketScore(item), 0),
    teamExecution: round(teamScore(item), 0),
  };
}

export const rankingModel = {
  version: '0.1',
  status: 'PROVISIONAL',
  scale: '0–100',
  weights: scoreWeights,
  note: 'Deterministic editorial model built from the public fields currently attached to each FORDEX record. It is a research score, not a valuation or investment recommendation.',
};

function calculateScore(components) {
  return scoreWeights.reduce((total, weight, index) => {
    const key = MODEL_KEYS[index];
    return total + (components[key] * weight.value) / 100;
  }, 0);
}

function buildBreakdown(components) {
  return scoreWeights.map((weight, index) => {
    const key = MODEL_KEYS[index];
    return {
      key,
      label: weight.label,
      weight: weight.value,
      score: components[key],
      contribution: round((components[key] * weight.value) / 100, 1),
    };
  });
}

const scored = startupRankings
  .map((item) => {
    const components = getComponentScores(item);
    return {
      ...item,
      sourceRank: item.rank,
      score: round(calculateScore(components), 1),
      scoreBreakdown: buildBreakdown(components),
    };
  })
  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  .map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

export const rankedStartupIndex = scored;
export const rankingSignals = MODEL_KEYS;
