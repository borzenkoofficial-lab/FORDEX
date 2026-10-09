import { writeFile } from 'node:fs/promises';
import { companyRegistry } from '../src/data/companyRegistry.js';
import { liveMarketSnapshot as previousSnapshot } from '../src/data/liveMarketSnapshot.js';

const OUTPUT_PATH = new URL('../src/data/liveMarketSnapshot.js', import.meta.url);
const WINDOW_DAYS = 30;
const CONCURRENCY = 8;
const MAX_ITEMS = 10;

const EVENT_PATTERNS = Object.freeze({
  fundingMentions: /(инвестиц|раунд|финансирован|привлек|привлеч|funding|investment|round|million|млн|млрд)/i,
  dealMentions: /(сделк|партнер|партнёр|контракт|клиент|collaboration|partnership|deal|customer|agreement)/i,
  launchMentions: /(запуст|релиз|новый продукт|новую версию|launch|release|product)/i,
  tractionMentions: /(пользовател|клиент|выручк|оборот|employees|сотрудник|транзакц|users|revenue)/i,
});

function decodeXml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .trim();
}

function tag(block, name) {
  const source = '<' + name + '(?: [^>]*)?>(.*?)</' + name + '>';
  const match = new RegExp(source, 'is').exec(block);
  return decodeXml(match?.[1] || '');
}

function normalizeTitle(value) {
  return value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, ' ').trim();
}

function parseItems(xml) {
  return [...xml.matchAll(/<item>.*?<\/item>/gis)]
    .map((match) => match[0])
    .map((block) => ({
      title: tag(block, 'title'),
      url: tag(block, 'link'),
      publishedAt: tag(block, 'pubDate'),
      sourceName: tag(block, 'source'),
      description: tag(block, 'description'),
    }))
    .filter((item) => item.title && item.url)
    .slice(0, MAX_ITEMS);
}

async function fetchCompany(company) {
  const query = encodeURIComponent('"' + company.name + '" ИИ');
  const url = 'https://news.google.com/rss/search?q=' + query + '&hl=ru&gl=RU&ceid=RU:ru';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FORDEX-Live-Market/1.0 (+https://github.com/borzenkoofficial-lab/FORDEX)',
      },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error('RSS ' + response.status);

    const items = parseItems(await response.text());
    const now = Date.now();
    const cutoff30 = now - WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const cutoff7 = now - 7 * 24 * 60 * 60 * 1000;
    const seen = new Set();
    const recent = [];

    for (const item of items) {
      const publishedMs = Date.parse(item.publishedAt);
      if (!Number.isFinite(publishedMs) || publishedMs < cutoff30) continue;

      const key = normalizeTitle(item.title) + '|' + item.url;
      if (seen.has(key)) continue;
      seen.add(key);
      recent.push({ ...item, publishedMs });
    }

    const ordered = recent.sort((a, b) => b.publishedMs - a.publishedMs);

    return {
      sourceCount30d: ordered.length,
      sourceCount7d: ordered.filter((item) => item.publishedMs >= cutoff7).length,
      fundingMentions: ordered.filter((item) => EVENT_PATTERNS.fundingMentions.test(item.title + ' ' + item.description)).length,
      dealMentions: ordered.filter((item) => EVENT_PATTERNS.dealMentions.test(item.title + ' ' + item.description)).length,
      launchMentions: ordered.filter((item) => EVENT_PATTERNS.launchMentions.test(item.title + ' ' + item.description)).length,
      tractionMentions: ordered.filter((item) => EVENT_PATTERNS.tractionMentions.test(item.title + ' ' + item.description)).length,
      latestPublishedAt: ordered[0]?.publishedAt || null,
      latestTitle: ordered[0]?.title || null,
      latestUrl: ordered[0]?.url || null,
      latestSourceName: ordered[0]?.sourceName || null,
      sources: ordered.slice(0, 5).map(({ title, url: sourceUrl, publishedAt, sourceName }) => ({
        title,
        url: sourceUrl,
        publishedAt,
        sourceName: sourceName || null,
      })),
    };
  } catch (error) {
    if (controller.signal.aborted) throw new Error('RSS_TIMEOUT for ' + company.name);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function mapWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;

      try {
        results[index] = await worker(items[index]);
      } catch (error) {
        results[index] = {
          sourceCount30d: 0,
          sourceCount7d: 0,
          fundingMentions: 0,
          dealMentions: 0,
          launchMentions: 0,
          tractionMentions: 0,
          latestPublishedAt: null,
          latestTitle: null,
          latestUrl: null,
          latestSourceName: null,
          sources: [],
          error: error instanceof Error ? error.message : 'FETCH_FAILED',
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

function serialize(snapshot) {
  return `// Generated by scripts/refresh-market.mjs. Do not edit manually.
export const LIVE_MARKET_SNAPSHOT_VERSION = '1.0';

export const liveMarketSnapshot = ${JSON.stringify(snapshot, null, 2)};

export function getLiveMarketSignal(companyId) {
  return liveMarketSnapshot.companies[companyId] ?? null;
}
`;
}

const rankedCompanies = companyRegistry
  .filter((item) => item.kind === 'INDEX COMPANY' || item.kind === 'EMERGING STARTUP')
  .sort((a, b) => {
    const aPriority = a.kind === 'INDEX COMPANY' ? 0 : 1;
    const bPriority = b.kind === 'INDEX COMPANY' ? 0 : 1;
    return aPriority - bPriority || a.name.localeCompare(b.name);
  })
  .slice(0, 80);

const rows = await mapWithConcurrency(rankedCompanies, fetchCompany, CONCURRENCY);
const failedRows = rows
  .map((row, index) => ({ row, company: rankedCompanies[index] }))
  .filter(({ row }) => row.error);

if (failedRows.length) {
  const examples = failedRows.slice(0, 5).map(({ company, row }) => company.name + ': ' + row.error).join('; ');
  throw new Error('[live-market] Refresh aborted; keeping the previous snapshot because '
    + failedRows.length + '/' + rankedCompanies.length + ' source queries failed. ' + examples);
}

const companies = Object.fromEntries(
  rankedCompanies.map((company, index) => [
    company.id,
    { companyId: company.id, companyName: company.name, ...rows[index] },
  ]),
);

const totalSourceCount30d = Object.values(companies)
  .reduce((sum, signal) => sum + signal.sourceCount30d, 0);
if (totalSourceCount30d === 0) {
  throw new Error('[live-market] Refresh aborted; no sources were found in the 30-day window.');
}

const previousTotalSourceCount30d = Object.values(previousSnapshot.companies || {})
  .reduce((sum, signal) => sum + (Number(signal.sourceCount30d) || 0), 0);
const minimumExpectedCount = previousTotalSourceCount30d >= 20
  ? Math.floor(previousTotalSourceCount30d * 0.25)
  : 1;
if (previousTotalSourceCount30d >= 20 && totalSourceCount30d < minimumExpectedCount) {
  throw new Error('[live-market] Refresh aborted; source count dropped from '
    + previousTotalSourceCount30d + ' to ' + totalSourceCount30d + '. Check the upstream feed before publishing.');
}

if (JSON.stringify(companies) === JSON.stringify(previousSnapshot.companies)) {
  console.log('Live market refresh checked', rankedCompanies.length, 'companies; no source-signal changes, keeping the current snapshot.');
} else {
  const snapshot = {
    generatedAt: new Date().toISOString(),
    windowDays: WINDOW_DAYS,
    source: 'Google News RSS discovery',
    companies,
  };

  await writeFile(OUTPUT_PATH, serialize(snapshot), 'utf8');
  console.log('Live market refresh:', Object.keys(companies).length, 'companies ·', totalSourceCount30d, 'sources in 30 days.');
}
