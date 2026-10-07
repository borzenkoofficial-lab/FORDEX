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
  const response = await fetch(url, {
    headers: { 'User-Agent': 'FORDEX-AI-Research/1.0' },
  });
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

    const queries = company?.name
      ? [
          '"' + company.name + '" ИИ',
          '"' + company.name + '" инвестиции',
          '"' + company.name + '" продукт',
        ]
      : [
          'российские AI стартапы инвестиции',
          'российский искусственный интеллект сделка',
          'российский AI новый продукт',
        ];

    const uniqueQueries = [...new Set(queries)].slice(0, MAX_COMPANIES);
    const batches = await Promise.all(
      uniqueQueries.map(async (query) => ({ query, items: await search(query) })),
    );

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

    return json(res, 200, {
      status: 'RESEARCH_READY',
      adapter: 'google-news-rss',
      queryCount: uniqueQueries.length,
      sourceCount: sources.length,
      sources: sources.slice(0, MAX_ITEMS),
    });
  } catch (error) {
    return json(res, 502, {
      error: error instanceof Error ? error.message : 'RESEARCH_ADAPTER_FAILED',
    });
  }
}
