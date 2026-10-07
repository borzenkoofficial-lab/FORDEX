import { scoreWeights } from '../data/startups.js';
import { companyRegistry } from '../data/companyRegistry.js';
import { youngLeaderRankings } from '../data/youngLeaders.js';
import { getLiveMarketSignal } from '../data/liveMarketSnapshot.js';

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
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value, digits = 1) => Number(value.toFixed(digits));

const youngById = new Map(youngLeaderRankings.map((item) => [item.id, item]));

function tractionScore(item, youngSignal) {
  const stageBase = STAGE_BASE[item.stage] ?? 60;
  const evidence = String(item.traction || item.evidence || item.description || '').toLowerCase();

  const qualitativeBonus =
    (evidence.includes('deployed') ? 5 : 0) +
    (evidence.includes('employees') ? 4 : 0) +
    (evidence.includes('products') ? 4 : 0) +
    (evidence.includes('transactions') ? 4 : 0) +
    (evidence.includes('international') ? 4 : 0) +
    (evidence.includes('portfolio') ? 3 : 0);

  const usersBonus = youngSignal?.usersK
    ? Math.min(14, Math.log10(Number(youngSignal.usersK) + 1) * 4)
    : 0;
  const mrrBonus = youngSignal?.mrrK
    ? Math.min(14, Math.log10(Number(youngSignal.mrrK) + 1) * 5)
    : 0;
  const payersBonus = youngSignal?.payers
    ? Math.min(8, Math.log10(Number(youngSignal.payers) + 1) * 2.2)
    : 0;

  return clamp(stageBase + qualitativeBonus + usersBonus + mrrBonus + payersBonus);
}

function capitalScore(item, youngSignal) {
  const fundingM = Number(item.fundingM ?? youngSignal?.capitalM ?? 0);
  const valuationM = Number(youngSignal?.valuationM ?? 0);
  const disclosed = Math.max(fundingM, valuationM);
  if (!disclosed) return 38;

  return clamp(43 + 18 * Math.log10(disclosed + 1));
}

function liveActivityLift(liveSignal) {
  if (!liveSignal) return 0;

  return clamp(
    Number(liveSignal.sourceCount7d || 0) * 0.4 +
    Number(liveSignal.sourceCount30d || 0) * 0.08 +
    Number(liveSignal.fundingMentions || 0) * 0.6 +
    Number(liveSignal.dealMentions || 0) * 0.3 +
    Number(liveSignal.launchMentions || 0) * 0.2 +
    Number(liveSignal.tractionMentions || 0) * 0.1,
    0,
    6,
  );
}

function momentumScore(item, youngSignal, liveSignal) {
  const activityLift = liveActivityLift(liveSignal);
  const momentum = Number(item.momentum);
  if (Number.isFinite(momentum)) return clamp(40 + (momentum + activityLift) * 2.6);

  const tractionSignal = Number(youngSignal?.signal);
  if (Number.isFinite(tractionSignal)) return clamp(45 + tractionSignal * 0.35 + activityLift);

  return clamp(48 + activityLift);
}

function technologyScore(item) {
  const values = (item.tags || []).map((tag) => TAG_SCORE[tag] ?? 70);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 70;
}

function marketScore(item) {
  return SECTOR_SCORE[item.sector] ?? technologyScore(item);
}

function teamScore(item, youngSignal) {
  const stageBonus = {
    SEED: 2,
    'PRE-SERIES A': 4,
    'SERIES A': 7,
    'SERIES B': 9,
    'SERIES C': 11,
    GROWTH: 12,
  }[item.stage] ?? 4;

  const verificationBase =
    item.verificationLevel === 'PRIMARY_SOURCE' ? 84 :
    item.verificationLevel === 'EDITORIAL_SCORED' ? 80 :
    item.verificationLevel === 'SOURCE_CLAIMED' ? 74 :
    66;

  const publicSignalBonus = youngSignal?.founderAge != null ? 2 : 0;
  return clamp(verificationBase + stageBonus + publicSignalBonus);
}

function getComponentScores(item, youngSignal, liveSignal) {
  return {
    businessTraction: round(tractionScore(item, youngSignal), 0),
    capitalFinancing: round(capitalScore(item, youngSignal), 0),
    growthMomentum: round(momentumScore(item, youngSignal, liveSignal), 0),
    technologyMoat: round(technologyScore(item), 0),
    marketOpportunity: round(marketScore(item), 0),
    teamExecution: round(teamScore(item, youngSignal), 0),
  };
}

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

const coreCompanies = companyRegistry.filter((item) => item.kind === 'INDEX COMPANY');
const scoredEmerging = youngLeaderRankings.map((item) => {
  const canonical = companyRegistry.find((company) => company.id === item.id);
  return canonical ? { ...canonical, ...item } : null;
}).filter(Boolean);

const candidates = [
  ...coreCompanies,
  ...scoredEmerging.filter((item, index, rows) => rows.findIndex((row) => row.id === item.id) === index),
];

const scored = candidates
  .map((item) => {
    const youngSignal = youngById.get(item.id);
    const liveSignal = getLiveMarketSignal(item.id);
    const components = getComponentScores(item, youngSignal, liveSignal);
    const isEmerging = item.kind === 'EMERGING STARTUP';
    const quantitativeSignals = [
      item.fundingM ?? youngSignal?.capitalM ?? null,
      youngSignal?.valuationM ?? null,
      youngSignal?.usersK ?? null,
      youngSignal?.mrrK ?? null,
      item.momentum ?? null,
    ].filter((value) => value != null);

    return {
      ...item,
      sourceRank: item.rank ?? null,
      previousRank: item.previousRank ?? null,
      isEmerging,
      indexStatus: isEmerging ? 'PUBLISHED · EMERGING' : 'PUBLISHED · CORE',
      quantitativeSignals: quantitativeSignals.length,
      liveSignals: liveSignal
        ? {
            sourceCount7d: Number(liveSignal.sourceCount7d || 0),
            sourceCount30d: Number(liveSignal.sourceCount30d || 0),
            fundingMentions: Number(liveSignal.fundingMentions || 0),
            dealMentions: Number(liveSignal.dealMentions || 0),
            launchMentions: Number(liveSignal.launchMentions || 0),
            tractionMentions: Number(liveSignal.tractionMentions || 0),
            latestPublishedAt: liveSignal.latestPublishedAt || null,
            latestTitle: liveSignal.latestTitle || null,
            latestUrl: liveSignal.latestUrl || null,
          }
        : null,
      score: round(calculateScore(components), 1),
      scoreBreakdown: buildBreakdown(components),
      confidence: isEmerging
        ? clamp(58 + quantitativeSignals.length * 8 + (item.source ? 4 : 0), 0, 94)
        : 92,
    };
  })
  .sort((a, b) =>
    b.score - a.score ||
    b.confidence - a.confidence ||
    a.name.localeCompare(b.name)
  )
  .map((item, index) => ({
    ...item,
    rank: index + 1,
    rankStatus: item.previousRank == null ? 'NEW' : 'TRACKED',
  }));

export const rankedStartupIndex = scored;
export const rankingSignals = MODEL_KEYS;

export const rankingModel = {
  version: '1.1',
  status: 'PUBLIC BETA · LIVE SIGNALS',
  scale: '0–100',
  weights: scoreWeights,
  candidatePolicy: {
    core: 'Все компании опубликованного core-индекса.',
    emerging: 'Молодые компании попадают в основной индекс только после появления сопоставимых количественных сигналов.',
    research: 'Остальные молодые компании остаются в research-слое и не получают искусственную оценку.',
  },
  note: 'Единая детерминированная модель FORDEX для опубликованного startup index. Базовые оценки остаются источником модели, а live market discovery добавляет ограниченный динамический lift только к компоненту growth / momentum. Live discovery не может напрямую изменить капитал, выручку, пользователей или формулу.',
};
