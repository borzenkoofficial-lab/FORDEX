import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { editorialArticles } from '../src/data/articles.js';
import { SEO_PAGES } from '../src/data/seo.js';
import { companyRegistry, companyRegistryStats } from '../src/data/companyRegistry.js';
import { founderRegistry, founderRegistryStats } from '../src/data/founderRegistry.js';
import { dealRecords } from '../src/data/deals.js';
import { startupRankings } from '../src/data/startups.js';
import { rankingCollections } from '../src/data/rankingCollections.js';
import { liveMarketSnapshot } from '../src/data/liveMarketSnapshot.js';

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
  let html = withPageMetadata(baseHtml, {
    title: route.page.title,
    description: route.page.description,
    canonicalUrl,
    noindex: route.noindex,
    schema,
  });
  const staticMarkup = renderRouteMarkup(route.key);
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('VITE_ROOT_CONTAINER_NOT_FOUND: ' + route.key);
  }
  html = html.replace('<div id="root"></div>', '<div id="root">' + staticMarkup + '</div>');
  const targetDirectory = route.path === '/'
    ? outputDirectory
    : new URL(route.path.slice(1), outputDirectory);
  await mkdir(targetDirectory, { recursive: true });
  await writeFile(route.path === '/' ? new URL('index.html', outputDirectory) : new URL('index.html', targetDirectory), html, 'utf8');
  pageSnapshots += 1;
}


function internalLink(path, label, className = '') {
  return '<a' + (className ? ' class="' + className + '"' : '') + ' href="' + htmlEscape(path) + '">' + htmlEscape(label) + '</a>';
}

function staticList(items, renderItem, className = 'seo-static-list') {
  if (!items.length) return '<p>Публичные материалы пока готовятся к публикации.</p>';
  return '<ul class="' + className + '">' + items.map((item) => '<li>' + renderItem(item) + '</li>').join('') + '</ul>';
}

function renderRouteMarkup(routeKey) {
  const page = SEO_PAGES[routeKey];
  if (!page) return '';

  const intro = '<header class="seo-static-intro"><p class="seo-static-kicker">FORDEX · ИНДЕКС AI-БИЗНЕСА РОССИИ</p>' +
    '<h1>' + htmlEscape(page.title.replace(/ — FORDEX$/, '')) + '</h1>' +
    '<p>' + htmlEscape(page.description) + '</p></header>';
  const section = (title, content) => '<section class="seo-static-section"><h2>' + htmlEscape(title) + '</h2>' + content + '</section>';

  if (routeKey === 'home') {
    const latest = editorialArticles.slice(0, 8);
    const metrics = '<dl class="seo-static-metrics">' +
      '<div><dt>Компании</dt><dd>' + companyRegistryStats.total + '</dd></div>' +
      '<div><dt>Основатели</dt><dd>' + founderRegistryStats.total + '</dd></div>' +
      '<div><dt>Сделки</dt><dd>' + dealRecords.length + '</dd></div>' +
      '<div><dt>Редакционные материалы</dt><dd>' + editorialArticles.length + '</dd></div></dl>';
    const links = '<nav class="seo-static-nav" aria-label="Разделы FORDEX">' +
      ['companies','founders','deals','rankings','market','news','analytics','sources'].map((key) => internalLink('/' + key + '/', SEO_PAGES[key].title.replace(/ — FORDEX$/, ''))).join('') +
      '</nav>';
    const latestList = staticList(latest, (article) => internalLink('/articles/' + encodeURIComponent(article.id) + '/', article.title) +
      '<p>' + htmlEscape(article.dek || article.lead || '') + '</p>', 'seo-static-articles');
    return '<div class="seo-static-content">' + intro + metrics + links + section('Свежие материалы', latestList) + '</div>';
  }

  if (routeKey === 'companies') {
    const items = companyRegistry.slice(0, 60);
    const list = staticList(items, (item) => '<h3>' + htmlEscape(item.name) + '</h3><p>' +
      htmlEscape([item.sector, item.stage, item.city].filter(Boolean).join(' · ')) + '</p><p>' +
      htmlEscape(item.description || '') + '</p>');
    return '<div class="seo-static-content">' + intro +
      section('Каталог компаний', '<p>В реестре FORDEX — ' + companyRegistryStats.total + ' профилей. Из них ' +
        companyRegistryStats.ranked + ' относятся к оценённым индексным компаниям, а ' +
        companyRegistryStats.emerging + ' — к исследуемым молодым проектам.</p>' + list) + '</div>';
  }

  if (routeKey === 'founders') {
    const items = founderRegistry.slice(0, 50);
    return '<div class="seo-static-content">' + intro +
      section('Основатели и команды', '<p>В реестре FORDEX — ' + founderRegistryStats.total +
        ' профилей. Указанные роли и описания относятся к данным реестра и требуют проверки по первоисточникам перед использованием в инвестиционных решениях.</p>' +
        staticList(items, (item) => '<h3>' + htmlEscape(item.name) + '</h3><p>' +
          htmlEscape([item.role, item.company, item.city].filter(Boolean).join(' · ')) + '</p><p>' +
          htmlEscape(item.description || '') + '</p>')) + '</div>';
  }

  if (routeKey === 'deals') {
    const items = [...dealRecords].sort((a,b) => (Number(b.valueM)||0) - (Number(a.valueM)||0));
    return '<div class="seo-static-content">' + intro +
      section('Записи о сделках', staticList(items, (item) => '<h3>' + htmlEscape(item.company) + ' — ' +
        htmlEscape(item.value || 'Сумма не раскрыта') + '</h3><p>' +
        htmlEscape([item.type, item.date, item.sector, item.lead].filter(Boolean).join(' · ')) +
        '</p><p>' + (item.verified ? 'В реестре отмечено как проверенная запись; это не заменяет повторную проверку условий сделки.' : 'Запись требует дополнительной проверки.') + '</p>')) + '</div>';
  }

  if (routeKey === 'rankings') {
    const items = [...startupRankings].sort((a,b) => (Number(a.rank)||9999) - (Number(b.rank)||9999)).slice(0, 35);
    const collections = staticList(rankingCollections, (item) => '<h3>' + htmlEscape(item.title || item.label || item.key) +
      '</h3><p>' + htmlEscape(item.description || '') + '</p><p>' + htmlEscape(item.status || '') + '</p>');
    const ranked = staticList(items, (item) => '<h3>№ ' + htmlEscape(item.rank) + ' · ' + htmlEscape(item.name) +
      ' — ' + htmlEscape(item.score) + '/100</h3><p>' + htmlEscape([item.sector, item.stage, item.city].filter(Boolean).join(' · ')) +
      '</p><p>' + htmlEscape(item.description || item.traction || '') + '</p>');
    return '<div class="seo-static-content">' + intro + section('Публичные серии индекса', collections) +
      section('Компании в основном индексе', ranked) +
      '<p class="seo-static-note">Рейтинг — редакционная оценка в рамках опубликованной методологии FORDEX. Он не является инвестиционной рекомендацией и может изменяться после проверки новых данных.</p></div>';
  }

  if (routeKey === 'market') {
    const rows = Object.values(liveMarketSnapshot.companies || {})
      .filter((item) => item.latestTitle && item.latestPublishedAt)
      .sort((a,b) => Date.parse(b.latestPublishedAt) - Date.parse(a.latestPublishedAt))
      .slice(0, 18);
    return '<div class="seo-static-content">' + intro +
      section('Наблюдаемые рыночные сигналы', '<p>Срез сформирован ' +
        htmlEscape(liveMarketSnapshot.generatedAt || 'без отметки времени') + ' по результатам автоматического обнаружения публичных упоминаний за окно до ' +
        htmlEscape(liveMarketSnapshot.windowDays || 30) + ' дней. Совпадение в новостной ленте — сигнал для проверки, а не подтверждение роста, выручки или инвестиционной сделки.</p>' +
        staticList(rows, (item) => '<h3>' + htmlEscape(item.companyName) + '</h3><p>' +
          htmlEscape(item.latestTitle) + '</p><p>' + htmlEscape(item.latestSourceName || '') +
          (item.latestPublishedAt ? ' · ' + htmlEscape(item.latestPublishedAt) : '') + '</p>')) + '</div>';
  }

  if (routeKey === 'news') {
    const items = editorialArticles.slice(0, 50);
    return '<div class="seo-static-content">' + intro +
      section('Редакционные материалы', staticList(items, (article) => internalLink('/articles/' + encodeURIComponent(article.id) + '/', article.title) +
        '<p>' + htmlEscape([article.category, article.date, article.readTime].filter(Boolean).join(' · ')) + '</p>' +
        '<p>' + htmlEscape(article.dek || article.lead || '') + '</p>', 'seo-static-articles')) + '</div>';
  }

  if (routeKey === 'analytics') {
    return '<div class="seo-static-content">' + intro +
      section('Как читать индекс', '<p>FORDEX разделяет подтверждённые факты, данные со слов компании и редакционную интерпретацию. Наличие упоминаний, сложность технологии или размер раунда сами по себе не гарантируют высокий рейтинг.</p>' +
        '<p>Оценки действуют в рамках собственной методологии, а источники и ограничения фиксируются отдельно. Разные бизнес-модели и стадии развития требуют сопоставимых, но не идентичных показателей.</p>' +
        internalLink('/sources/', 'Правила источников и проверки данных') + ' · ' +
        internalLink('/rankings/', 'Посмотреть рейтинги')) + '</div>';
  }

  if (routeKey === 'sources') {
    return '<div class="seo-static-content">' + intro +
      section('Принципы работы с данными', '<p>Приоритет отдается первоисточникам: официальным сообщениям компаний, публикациям инвесторов, реестрам и документам. Вторичные публикации используются как навигационный сигнал и требуют проверки.</p>' +
        '<p>FORDEX разделяет источник, проверяемое утверждение и редакционный вывод. Отсутствие открытых данных не должно автоматически трактоваться как отсутствие бизнеса, выручки или traction.</p>' +
        internalLink('/analytics/', 'Открыть методологию рейтингов')) + '</div>';
  }

  if (routeKey === 'watchlist') {
    return '<div class="seo-static-content">' + intro + '<p>Список наблюдения хранится локально в браузере и не публикуется в индексе FORDEX.</p>' +
      internalLink('/companies/', 'Перейти к каталогу компаний') + '</div>';
  }

  if (routeKey === 'control') {
    return '<div class="seo-static-content">' + intro + '<p>Закрытая рабочая зона редакции. Доступ к операциям AI проверяется серверным ключом.</p></div>';
  }

  return '<div class="seo-static-content">' + intro + '</div>';
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
    '</article></section>' +
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
