import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { editorialArticles } from '../src/data/articles.js';
import { SEO_PAGES } from '../src/data/seo.js';

const outputDirectory = new URL('../dist/', import.meta.url);
const configuredUrl = String(process.env.SITE_URL || '').trim();

function normalizeSiteUrl(value) {
  if (!value) return '';
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('SITE_URL must use http:// or https://');
  }
  if (url.pathname !== '/' || url.username || url.password || url.search || url.hash) {
    throw new Error('SITE_URL must be a public origin without credentials, query, or hash');
  }
  return url.origin;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setHtmlMeta(html, attribute, key, content) {
  const pattern = new RegExp('<meta\\s+[^>]*' + attribute + '="' + key + '"[^>]*>', 'i');
  const existing = html.match(pattern);
  const safeContent = htmlEscape(content);
  if (existing) {
    const replaced = existing[0].replace(/content="[^"]*"/i, 'content="' + safeContent + '"');
    return html.replace(pattern, replaced);
  }
  return html.replace('</head>', '    <meta ' + attribute + '="' + htmlEscape(key) + '" content="' + safeContent + '" />\n  </head>');
}

function setCanonical(html, canonicalUrl) {
  const link = '<link rel="canonical" href="' + htmlEscape(canonicalUrl) + '" />';
  const pattern = /<link\s+rel="canonical"[^>]*>/i;
  return pattern.test(html)
    ? html.replace(pattern, link)
    : html.replace('</head>', '    ' + link + '\n  </head>');
}

function setStructuredData(html, schema) {
  const tag = '<script id="fordex-structured-data" type="application/ld+json">' +
    JSON.stringify(schema).replace(/</g, '\\u003c') +
    '</script>';
  const pattern = /<script\s+id="fordex-structured-data"[^>]*>[\s\S]*?<\/script>/i;
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', '    ' + tag + '\n  </head>');
}

const siteUrl = normalizeSiteUrl(configuredUrl);
const robotsLines = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /api/',
];
if (siteUrl) robotsLines.push('Sitemap: ' + siteUrl + '/sitemap.xml');
await writeFile(new URL('robots.txt', outputDirectory), robotsLines.join('\n') + '\n', 'utf8');

if (!siteUrl) {
  console.warn('[seo] SITE_URL is not configured; robots.txt was written without a sitemap or route HTML snapshots.');
  process.exit(0);
}

const routes = Object.entries(SEO_PAGES).map(([key, page]) => ({
  key,
  page,
  path: key === 'home' ? '/' : '/' + key + '/',
  noindex: Boolean(page.noindex),
}));
const uniqueArticles = editorialArticles.filter((article) => article?.id && article?.title);
const articlePaths = uniqueArticles.map((article) => '/articles/' + encodeURIComponent(article.id) + '/');
const publicPaths = routes.filter((route) => !route.noindex).map((route) => route.path);
const paths = [...new Set([...publicPaths, ...articlePaths])];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...paths.map((path) => '  <url><loc>' + xmlEscape(siteUrl + path) + '</loc></url>'),
  '</urlset>',
  '',
].join('\n');
await writeFile(new URL('sitemap.xml', outputDirectory), xml, 'utf8');

const baseHtml = await readFile(new URL('index.html', outputDirectory), 'utf8');

function schemaForPage(page, canonicalUrl, siteName = 'FORDEX') {
  const type = page.type || 'WebPage';
  if (type === 'WebSite') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      alternateName: 'Индекс AI-бизнеса России',
      url: canonicalUrl,
      inLanguage: 'ru-RU',
      description: page.description,
      publisher: { '@type': 'Organization', name: siteName, url: siteUrl },
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: page.title,
    description: page.description,
    url: canonicalUrl,
    inLanguage: 'ru-RU',
    isPartOf: { '@type': 'WebSite', name: siteName, url: siteUrl },
    publisher: { '@type': 'Organization', name: siteName, url: siteUrl },
  };
}

function withPageMetadata(html, { title, description, canonicalUrl, noindex = false, schema, type = 'website' }) {
  html = html.replace(/<title>[^<]*<\/title>/i, '<title>' + htmlEscape(title) + '</title>');
  html = setHtmlMeta(html, 'name', 'description', description);
  html = setHtmlMeta(html, 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  html = setHtmlMeta(html, 'property', 'og:type', type);
  html = setHtmlMeta(html, 'property', 'og:site_name', 'FORDEX');
  html = setHtmlMeta(html, 'property', 'og:locale', 'ru_RU');
  html = setHtmlMeta(html, 'property', 'og:title', title);
  html = setHtmlMeta(html, 'property', 'og:description', description);
  html = setHtmlMeta(html, 'property', 'og:url', canonicalUrl);
  html = setHtmlMeta(html, 'name', 'twitter:card', 'summary');
  html = setHtmlMeta(html, 'name', 'twitter:title', title);
  html = setHtmlMeta(html, 'name', 'twitter:description', description);
  html = setCanonical(html, canonicalUrl);
  return setStructuredData(html, schema);
}

let pageSnapshots = 0;
for (const route of routes) {
  const canonicalUrl = siteUrl + route.path;
  const schema = schemaForPage(route.page, canonicalUrl);
  const html = withPageMetadata(baseHtml, {
    title: route.page.title,
    description: route.page.description,
    canonicalUrl,
    noindex: route.noindex,
    schema,
  });
  const targetDirectory = route.path === '/'
    ? outputDirectory
    : new URL(route.path.slice(1), outputDirectory);
  await mkdir(targetDirectory, { recursive: true });
  await writeFile(route.path === '/' ? new URL('index.html', outputDirectory) : new URL('index.html', targetDirectory), html, 'utf8');
  pageSnapshots += 1;
}

let articlePagesWritten = 0;
for (const article of uniqueArticles) {
  if (!/^[a-z0-9-]+$/i.test(article.id)) {
    throw new Error('ARTICLE_ID_NOT_URL_SAFE: ' + article.id);
  }
  const slug = encodeURIComponent(article.id);
  const canonicalUrl = siteUrl + '/articles/' + slug + '/';
  const description = String(article.dek || article.lead || article.title).replace(/\s+/g, ' ').trim().slice(0, 300);
  const title = article.title + ' — FORDEX';
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description,
    mainEntityOfPage: canonicalUrl,
    publisher: { '@type': 'Organization', name: 'FORDEX', url: siteUrl },
    author: article.person
      ? { '@type': 'Person', name: article.person }
      : { '@type': 'Organization', name: 'Редакция FORDEX' },
    articleSection: article.category || 'AI Business',
    inLanguage: 'ru-RU',
  };
  const publishedAt = article.date ? Date.parse(article.date) : NaN;
  if (Number.isFinite(publishedAt)) schema.datePublished = new Date(publishedAt).toISOString();
  const html = withPageMetadata(baseHtml, {
    title,
    description,
    canonicalUrl,
    schema,
    type: 'article',
  });

  const articleDirectory = new URL('articles/' + slug + '/', outputDirectory);
  await mkdir(articleDirectory, { recursive: true });
  await writeFile(new URL('index.html', articleDirectory), html, 'utf8');
  articlePagesWritten += 1;
}

console.log('[seo] Generated sitemap for ' + paths.length + ' URLs, ' + pageSnapshots + ' route metadata pages and ' + articlePagesWritten + ' article metadata pages at ' + siteUrl);
