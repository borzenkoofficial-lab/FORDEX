import { rankedStartupIndex, rankingModel } from '../src/lib/rankingEngine.js';

const fail = (message) => {
  console.error('RANKING VERIFY FAILED:', message);
  process.exit(1);
};

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
