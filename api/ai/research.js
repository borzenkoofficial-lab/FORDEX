const MAX_ITEMS = 12;
const MAX_COMPANIES = 5;
const WINDOW_DAYS = 14;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

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
    .filter((item) => item.title && item.url);
}

async function search(query) {
  const url = 'https://news.google.com/rss/search?q='
    + encodeURIComponent(query)
    + '&hl=ru&gl=RU&ceid=RU:ru';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': 'FORDEX-AI-Research/1.0' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error('NEWS_RSS_' + response.status);

  const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const seen = new Set();
  const items = [];

  for (const item of parseItems(await response.text())) {
    const timestamp = Date.parse(item.publishedAt);
    if (!Number.isFinite(timestamp) || timestamp < cutoff) continue;
    const key = item.title.toLowerCase() + '|' + item.url;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ ...item, timestamp });
  }

  return items
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_ITEMS)
    .map(({ title, url, publishedAt, sourceName, description }) => ({
      title,
      url,
      publishedAt,
      sourceName: sourceName || null,
      description: description || '',
    }));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return json(res, 200, {
      status: 'READY',
      adapter: 'google-news-rss',
      windowDays: WINDOW_DAYS,
      maxItems: MAX_ITEMS,
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const objective = String(body.objective || '').trim();
    const company = body.company && typeof body.company === 'object' ? body.company : null;

    if (!objective && !company?.name) {
      return json(res, 400, { error: 'RESEARCH_QUERY_REQUIRED' });
    }

    const normalizedObjective = objective.replace(/\s+/g, ' ').slice(0, 220);
    const queries = company?.name
      ? [
          '"' + company.name + '" ИИ',
          '"' + company.name + '" инвестиции',
          '"' + company.name + '" продукт',
          '"' + company.name + '" запуск',
        ]
      : [
          normalizedObjective,
          normalizedObjective + ' российский AI стартап',
          'российские молодые AI стартапы новый продукт',
          'российский AI стартап запуск продукта инвестиции',
        ];

    const uniqueQueries = [...new Set(queries)].slice(0, MAX_COMPANIES);
    const settled = await Promise.allSettled(
      uniqueQueries.map(async (query) => ({ query, items: await search(query) })),
    );

    const batches = [];
    const errors = [];
    for (let index = 0; index < settled.length; index += 1) {
      const result = settled[index];
      if (result.status === 'fulfilled') batches.push(result.value);
      else errors.push({ query: uniqueQueries[index], error: result.reason instanceof Error ? result.reason.message : 'SEARCH_FAILED' });
    }

    const seen = new Set();
    const sources = [];
    for (const batch of batches) {
      for (const item of batch.items) {
        if (seen.has(item.url)) continue;
        seen.add(item.url);
        sources.push({ ...item, query: batch.query });
      }
    }

    sources.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

    const fallbackSources = company?.name && company?.website
      ? [{
          title: company.name + ' — официальный сайт',
          url: company.website,
          publishedAt: null,
          sourceName: company.name,
          description: 'Fallback discovery source. Требует отдельной проверки перед публикацией.',
          query: 'company-official-site',
        }]
      : [];

    const mergedSources = [...sources];
    for (const item of fallbackSources) {
      if (!seen.has(item.url)) mergedSources.push(item);
    }

    return json(res, 200, {
      status: mergedSources.length ? 'RESEARCH_READY' : 'RESEARCH_DEGRADED',
      adapter: 'google-news-rss',
      queryCount: uniqueQueries.length,
      successfulQueries: batches.length,
      failedQueries: errors.length,
      sourceCount: mergedSources.length,
      warnings: errors,
      sources: mergedSources.slice(0, MAX_ITEMS),
    });
  } catch (error) {
    // Research is an enrichment stage, not a hard availability dependency.
    // Never turn a temporary upstream/search failure into RESEARCH_REQUEST_FAILED
    // for the whole control-room run. Return an explicit degraded result so the
    // caller can decide whether to continue without discovered sources.
    return json(res, 200, {
      status: 'RESEARCH_DEGRADED',
      adapter: 'google-news-rss',
      queryCount: 0,
      successfulQueries: 0,
      failedQueries: 0,
      sourceCount: 0,
      warnings: [{
        query: null,
        error: error instanceof Error ? error.message : 'RESEARCH_ADAPTER_FAILED',
      }],
      sources: [],
    });
  }
}
