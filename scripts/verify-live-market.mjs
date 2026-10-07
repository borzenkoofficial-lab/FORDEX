import { companyRegistry } from '../src/data/companyRegistry.js';
import { LIVE_MARKET_SNAPSHOT_VERSION, liveMarketSnapshot } from '../src/data/liveMarketSnapshot.js';

const fail = (message) => {
  console.error('LIVE MARKET VERIFY FAILED:', message);
  process.exit(1);
};

if (LIVE_MARKET_SNAPSHOT_VERSION !== '1.0') fail('unexpected snapshot version');
if (!liveMarketSnapshot || typeof liveMarketSnapshot !== 'object') fail('snapshot missing');
if (liveMarketSnapshot.windowDays !== 30) fail('windowDays must be 30');

const companyIds = new Set(companyRegistry.map((item) => item.id));
for (const [id, signal] of Object.entries(liveMarketSnapshot.companies || {})) {
  if (!companyIds.has(id)) fail('unknown company: ' + id);
  for (const key of ['sourceCount30d', 'sourceCount7d', 'fundingMentions', 'dealMentions', 'launchMentions', 'tractionMentions']) {
    if (!Number.isInteger(signal[key]) || signal[key] < 0) fail(id + ': invalid ' + key);
  }
  if (signal.sourceCount7d > signal.sourceCount30d) fail(id + ': 7d count exceeds 30d count');
}

console.log(
  'Live market verified:',
  Object.keys(liveMarketSnapshot.companies || {}).length,
  'company signals · generated',
  liveMarketSnapshot.generatedAt || 'not refreshed yet',
);
