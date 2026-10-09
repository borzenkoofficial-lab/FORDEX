import { rankedStartupIndex, rankingModel } from '../src/lib/rankingEngine.js';
import { startupRankings } from '../src/data/startups.js';

const fail = (message) => {
  console.error('RANKING VERIFY FAILED:', message);
  process.exit(1);
};

const rankedRecordIds = startupRankings.map((item) => item.id);
if (rankedRecordIds.some((id) => !id) || new Set(rankedRecordIds).size !== rankedRecordIds.length) {
  fail('source ranking records must have unique IDs');
}

function assertHttpUrl(value, label) {
  let url;
  try { url = new URL(String(value || '')); } catch { fail(label + ': invalid URL'); }
  if (!['http:', 'https:'].includes(url.protocol)) fail(label + ': source must use HTTP(S)');
}

for (const record of startupRankings) {
  if (!record.name || !record.source) fail((record.id || 'unknown') + ': company name or primary source missing');
  assertHttpUrl(record.source, record.id + ' primary source');
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(String(record.lastVerified || ''))) {
    fail(record.id + ': lastVerified must use YYYY-MM');
  }

  if (record.fundingM != null) {
    if (!Number.isFinite(Number(record.fundingM)) || Number(record.fundingM) <= 0) {
      fail(record.id + ': exact fundingM must be a positive number or null');
    }
    if (!record.fundingSource) fail(record.id + ': exact funding requires a dedicated fundingSource');
  }
  if (record.fundingSource) assertHttpUrl(record.fundingSource, record.id + ' funding source');
  if (/^(?:ДО\b|UP TO\b)/i.test(String(record.funding || '')) && record.fundingM != null) {
    fail(record.id + ': a funding ceiling must not be scored as an exact funding amount');
  }
}

const rows = rankedStartupIndex;
const weightsTotal = rankingModel.weights.reduce((sum, item) => sum + item.value, 0);

if (!rows.length) fail('ranking dataset is empty');
if (weightsTotal !== 100) fail(`weights must total 100, got ${weightsTotal}`);

const ranks = rows.map((item) => item.rank);
const expectedRanks = rows.map((_, index) => index + 1);

if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) fail('ranks are not sequential');
if (new Set(rows.map((item) => item.id)).size !== rows.length) fail('duplicate company ids detected');
if (rows.some((item) => !item.source)) fail('every ranked company must have a source');
if (rows.some((item) => !Number.isFinite(item.score) || item.score < 0 || item.score > 100)) fail('score outside 0–100');
if (rows.some((item) => item.scoreBreakdown.length !== rankingModel.weights.length)) fail('score breakdown is incomplete');

for (const item of rows) {
  const recomputed = item.scoreBreakdown.reduce((sum, signal) => sum + signal.contribution, 0);
  if (Math.abs(recomputed - item.score) > 0.2) {
    fail(`${item.name}: breakdown ${recomputed} does not reconcile with score ${item.score}`);
  }
}

console.log(`Ranking verified: ${rows.length} companies · model ${rankingModel.version} · weights ${weightsTotal}%`);
