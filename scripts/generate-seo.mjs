import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { editorialArticles } from '../src/data/articles.js';

const outputDirectory = new URL('../dist/', import.meta.url);
const configuredUrl = String(process.env.SITE_URL || '').trim();

function normalizeSiteUrl(value) {
  if (!value) return '';
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('SITE_URL must use http:// or https://');
  }
  if (url.username || url.password || url.search || url.hash) {
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

const siteUrl = normalizeSiteUrl(configuredUrl);
const robotsLines = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /api/',
];
if (siteUrl) robotsLines.push('Sitemap: ' + siteUrl + '/sitemap.xml');
await writeFile(new URL('robots.txt', outputDirectory), robotsLines.join('\n') + '\n', 'utf8');

if (!siteUrl) {
  console.warn('[seo] SITE_URL is not configured; robots.txt was written without a sitemap and sitemap.xml was skipped.');
  process.exit(0);
}

const publicPaths = [
  '/',
  '/companies/',
  '/founders/',
  '/deals/',
  '/rankings/',
  '/market/',
  '/sources/',
  '/news/',
  '/analytics/',
];
const articlePaths = editorialArticles
  .filter((article) => article?.id && article?.title)
  .map((article) => '/articles/' + encodeURIComponent(article.id) + '/');
const paths = [...new Set([...publicPaths, ...articlePaths])];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...paths.map((path) => '  <url><loc>' + xmlEscape(siteUrl + path) + '</loc></url>'),
  '</urlset>',
  '',
].join('\n');

await writeFile(new URL('sitemap.xml', outputDirectory), xml, 'utf8');
console.log('[seo] Generated sitemap.xml for ' + paths.length + ' canonical routes at ' + siteUrl);
