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
if (!siteUrl && process.env.VERCEL_ENV === 'production') {
  throw new Error('[seo] SITE_URL is required for a production deployment. Set it to the final public HTTPS origin before building.');
}

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

function renderRouteMarkup(route, allRoutes, articles) {
  const title = htmlEscape(route.page.title || 'FORDEX');
  const description = htmlEscape(route.page.description || '');
  const navigation = allRoutes
    .filter((item) => !item.noindex && item.key !== route.key)
    .map((item) => '<a href="' + htmlEscape(item.path) + '">' + htmlEscape(item.page.title.replace(/ — FORDEX$/, '')) + '</a>')
    .join('');
  let featured;
  if (route.key === 'news') {
    featured = articles;
  } else if (route.key === 'founders') {
    featured = articles.filter((article) => article.builderStory);
  } else if (route.key === 'home') {
    featured = articles.slice(0, 8);
  } else {
    featured = articles.slice(0, 5);
  }

  const aboutSections = route.key === 'about'
    ? [
      '<section class="seo-static-section"><h2>Три слоя данных</h2><ul>',
      '<li><strong>Публичный индекс.</strong> Компании, прошедшие отбор для сопоставимой оценки по модели FORDEX.</li>',
      '<li><strong>Исследовательское покрытие.</strong> Молодые команды и проекты, которые исследуются, но не получают рейтинг автоматически.</li>',
      '<li><strong>Внешние источники.</strong> Публикации и сторонние рейтинги остаются отдельными сигналами, а не оценками FORDEX.</li>',
      '</ul></section>',
      '<section class="seo-static-section"><h2>Как читать оценки</h2>',
      '<p>Рейтинг рассчитывается по шести взвешенным сигналам, раскрытым в методологии. Балл нужен для сравнения внутри модели FORDEX; это не оценка бизнеса, не рыночная капитализация, не финансовый прогноз и не инвестиционная рекомендация.</p>',
      '<p>Если публичная сумма финансирования не раскрыта, она не заменяется приблизительной оценкой. Сведения могут быть неполными или устаревать; отсутствие компании или показателя в индексе не доказывает отсутствия деятельности.</p></section>',
    ].join('')
    : '';

  const articleList = featured.length
    ? '<section class="seo-static-section"><h2>' +
      (route.key === 'founders' ? 'Builder Stories — люди и продукты' : route.key === 'news' ? 'Редакционные материалы FORDEX' : 'Последние редакционные сигналы') +
      '</h2><ul class="seo-static-articles">' +
      featured.map((article) => {
        const href = '/articles/' + encodeURIComponent(article.id) + '/';
        return '<li><span class="seo-static-kicker">' + htmlEscape(article.category || 'AI BUSINESS') + ' · ' +
          htmlEscape(article.date || '') + '</span><a href="' + href + '">' + htmlEscape(article.title) +
          '</a><p>' + htmlEscape(article.dek || article.lead || '') + '</p></li>';
      }).join('') +
      '</ul></section>'
    : '';

  return '<main class="seo-static-content">' +
    '<header class="seo-static-intro"><p class="seo-static-kicker">' +
      (route.noindex ? 'ЗАКРЫТАЯ ЗОНА FORDEX' : 'FORDEX · ИНДЕКС AI-БИЗНЕСА РОССИИ') +
      '</p><h1>' + title + '</h1><p>' + description + '</p></header>' +
    (route.noindex ? '' : '<nav class="seo-static-nav" aria-label="Разделы FORDEX">' + navigation + '</nav>') +
    (route.noindex ? '' : aboutSections) +
    (route.noindex ? '' : articleList) +
    '</main>';
}


let pageSnapshots = 0;
for (const route of routes) {
  const canonicalUrl = siteUrl + route.path;
  const schema = schemaForPage(route.page, canonicalUrl);
  let html = withPageMetadata(baseHtml, {
    title: route.page.title,
    description: route.page.description,
    canonicalUrl,
    noindex: route.noindex,
    schema,
  });
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('VITE_ROOT_CONTAINER_NOT_FOUND: ' + route.path);
  }
  html = html.replace('<div id="root"></div>', '<div id="root">' + renderRouteMarkup(route, routes, uniqueArticles) + '</div>');
  const targetDirectory = route.path === '/'
    ? outputDirectory
    : new URL(route.path.slice(1), outputDirectory);
  await mkdir(targetDirectory, { recursive: true });
  await writeFile(route.path === '/' ? new URL('index.html', outputDirectory) : new URL('index.html', targetDirectory), html, 'utf8');
  pageSnapshots += 1;
}

function renderArticleMarkup(article) {
  const position = editorialArticles.indexOf(article) + 1;
  const dateLabel = htmlEscape(article.date || '');
  const category = htmlEscape(article.category || 'AI Business');
  const issue = article.issue ? htmlEscape(article.issue) + ' · ' : '';
  const person = article.person ? ' · ' + htmlEscape(article.person) : '';
  const title = htmlEscape(article.title);
  const dek = htmlEscape(article.dek || '');
  const image = article.media?.src
    ? '<div class="article-hero-media"><img src="' + htmlEscape(article.media.src) + '" alt="' + htmlEscape(article.media.alt || article.title) + '" /></div>'
    : '';
  const builderCard = article.person
    ? '<div class="article-source article-builder-card"><span>FORDEX BUILDER STORY · ' + htmlEscape(article.builderStatus || '') +
      '</span><strong>' + htmlEscape(article.person) + ' · ' + htmlEscape(article.project || '') +
      '</strong><p>' + htmlEscape(article.builderType || '') + '</p></div>'
    : '';
  const sections = (Array.isArray(article.sections) ? article.sections : []).map((section) =>
    '<section class="article-section"><h2>' + htmlEscape(section.heading || '') + '</h2>' +
    (Array.isArray(section.paragraphs) ? section.paragraphs : [])
      .map((paragraph) => '<p>' + htmlEscape(paragraph) + '</p>').join('') +
    '</section>'
  ).join('');

  return '<main class="inner-page article-page">' +
    '<section class="article-hero' + (article.specialBuilderStory ? ' special-builder-hero' : '') + '">' +
      '<div class="article-hero-top"><span>' + issue + category + ' · ' + dateLabel + ' · ' +
        htmlEscape(article.readTime || '') + person + '</span>' +
        '<a class="article-back" href="/news/">ВСЕ СТАТЬИ</a></div>' +
      '<div class="article-hero-grid">' +
        '<span class="article-number">' + String(position).padStart(2, '0') + '</span>' +
        '<div><h1>' + title + '</h1><p>' + dek + '</p></div>' + image +
      '</div>' +
    '</section>' +
    '<section class="article-body"><article class="article-main">' +
      builderCard +
      '<p class="article-lead">' + htmlEscape(article.lead || '') + '</p>' +
      sections +
    '</article><aside class="article-aside"><div><span>ДРУГИЕ МАТЕРИАЛЫ</span>' +
      editorialArticles.filter((item) => item.id !== article.id).slice(0, 3).map((item) =>
        '<a href="/articles/' + encodeURIComponent(item.id) + '/"><small>' + htmlEscape(item.date || '') +
        '</small><strong>' + htmlEscape(item.title) + '</strong><span aria-hidden="true">→</span></a>'
      ).join('') +
    '</div></aside></section>' +
  '</main>';
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
  let html = withPageMetadata(baseHtml, {
    title,
    description,
    canonicalUrl,
    schema,
    type: 'article',
  });
  const staticMarkup = renderArticleMarkup(article);
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('VITE_ROOT_CONTAINER_NOT_FOUND: ' + article.id);
  }
  html = html.replace('<div id="root"></div>', '<div id="root">' + staticMarkup + '</div>');

  const articleDirectory = new URL('articles/' + slug + '/', outputDirectory);
  await mkdir(articleDirectory, { recursive: true });
  await writeFile(new URL('index.html', articleDirectory), html, 'utf8');
  articlePagesWritten += 1;
}

console.log('[seo] Generated sitemap for ' + paths.length + ' URLs, ' + pageSnapshots + ' route metadata pages and ' + articlePagesWritten + ' article metadata pages at ' + siteUrl);
