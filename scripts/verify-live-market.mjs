import { companyRegistry } from '../src/data/companyRegistry.js';
import { LIVE_MARKET_SNAPSHOT_VERSION, liveMarketSnapshot } from '../src/data/liveMarketSnapshot.js';

const fail = (message) => {
  console.error('LIVE MARKET VERIFY FAILED:', message);
  process.exit(1);
};

function assertHttpUrl(value, label) {
  let url;
  try {
    url = new URL(String(value || ''));
  } catch {
    fail(label + ': invalid source URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) fail(label + ': source URL must use HTTP(S)');
}

if (LIVE_MARKET_SNAPSHOT_VERSION !== '1.0') fail('unexpected snapshot version');
if (!liveMarketSnapshot || typeof liveMarketSnapshot !== 'object') fail('snapshot missing');
if (liveMarketSnapshot.windowDays !== 30) fail('windowDays must be 30');
if (!Number.isFinite(Date.parse(liveMarketSnapshot.generatedAt || ''))) fail('generatedAt must be a valid timestamp');

const expectedCompanies = companyRegistry
  .filter((item) => item.kind === 'INDEX COMPANY' || item.kind === 'EMERGING STARTUP')
  .sort((a, b) => {
    const aPriority = a.kind === 'INDEX COMPANY' ? 0 : 1;
    const bPriority = b.kind === 'INDEX COMPANY' ? 0 : 1;
    return aPriority - bPriority || a.name.localeCompare(b.name);
  })
  .slice(0, 80);
const expectedIds = new Set(expectedCompanies.map((item) => item.id));
const companySignals = liveMarketSnapshot.companies || {};
const signalIds = Object.keys(companySignals);

if (signalIds.length !== expectedIds.size) {
  fail('expected ' + expectedIds.size + ' market signals, got ' + signalIds.length);
}

let totalSources30d = 0;
let companiesWithCoverage = 0;

for (const id of expectedIds) {
  const signal = companySignals[id];
  if (!signal) fail('missing company signal: ' + id);
  if (signal.error) fail(id + ': failed refresh data must not be published');
  if (signal.companyId !== id) fail(id + ': companyId mismatch');
  if (!signal.companyName) fail(id + ': company name missing');

  for (const key of ['sourceCount30d', 'sourceCount7d', 'fundingMentions', 'dealMentions', 'launchMentions', 'tractionMentions']) {
    if (!Number.isInteger(signal[key]) || signal[key] < 0) fail(id + ': invalid ' + key);
  }
  if (signal.sourceCount7d > signal.sourceCount30d) fail(id + ': 7d count exceeds 30d count');

  if (!Array.isArray(signal.sources)) fail(id + ': sources must be an array');
  if (signal.sources.length > 5) fail(id + ': no more than five source records may be stored');
  totalSources30d += signal.sourceCount30d;
  if (signal.sourceCount30d > 0) {
    companiesWithCoverage += 1;
    if (!signal.latestTitle || !signal.latestPublishedAt || !signal.latestUrl) {
      fail(id + ': latest article metadata missing despite non-zero source count');
    }
    if (!Number.isFinite(Date.parse(signal.latestPublishedAt))) fail(id + ': latestPublishedAt is invalid');
    assertHttpUrl(signal.latestUrl, id + ' latest article');

    if (signal.sources.length === 0) fail(id + ': source count is non-zero but source list is empty');
    for (const source of signal.sources) {
      if (!source.title) fail(id + ': source title missing');
      if (!Number.isFinite(Date.parse(source.publishedAt || ''))) fail(id + ': source publishedAt is invalid');
      assertHttpUrl(source.url, id + ' source');
    }
  } else if (signal.sources.length || signal.latestUrl || signal.latestPublishedAt || signal.latestTitle) {
    fail(id + ': empty coverage must not retain stale article metadata');
  }
}

if (totalSources30d <= 0 || companiesWithCoverage === 0) {
  fail('snapshot has no recent market sources; refusing to publish an empty refresh');
}

console.log(
  'Live market verified:',
  signalIds.length, 'company signals ·',
  totalSources30d, 'sources in 30 days across',
  companiesWithCoverage, 'companies · generated',
  liveMarketSnapshot.generatedAt,
);
