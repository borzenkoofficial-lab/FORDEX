import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const generator = await readFile(new URL('./generate-seo.mjs', import.meta.url), 'utf8');
const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');

assert.match(html, /<html lang="ru">/, 'document language must be Russian');
assert.match(html, /name="description"/, 'document must provide a description');
assert.match(html, /property="og:title"/, 'document must provide Open Graph defaults');
assert.match(html, /rel="icon".*favicon\.svg/, 'document must reference its favicon');
assert.match(app, /function routeToPath\(/, 'routes must have stable path URLs');
assert.match(app, /link\[rel="canonical"\]/, 'route changes must update canonical URLs');
assert.match(app, /application\/ld\+json/, 'route changes must emit structured data');
assert.match(app, /'@type': 'Article'/, 'editorial articles must use Article structured data');
assert.match(generator, /process\.env\.SITE_URL/, 'sitemap generation must use an explicit production base URL');
assert.match(generator, /sitemap\.xml/, 'sitemap generator must emit a sitemap');
assert.match(generator, /editorialArticles/, 'sitemap must include editorial articles');
assert.match(robots, /User-agent: \*/, 'robots.txt must declare crawler rules');
assert.match(robots, /Disallow: \/api\//, 'robots.txt must keep API endpoints out of crawl discovery');
assert.match(favicon, /<svg/, 'favicon SVG must exist');
console.log('SEO verification passed: Russian metadata, canonical paths, structured data, sitemap generation, robots, favicon.');
