import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { editorialArticles } from '../src/data/articles.js';
import { SEO_PAGES } from '../src/data/seo.js';

const dist = new URL('../dist/', import.meta.url);
const siteUrl = String(process.env.SITE_URL || '').replace(/\/$/, '');
assert.ok(siteUrl, 'CI/production output verification requires SITE_URL');

const sitemap = await readFile(new URL('sitemap.xml', dist), 'utf8');
const robots = await readFile(new URL('robots.txt', dist), 'utf8');
assert.match(sitemap, /<urlset[^>]*sitemaps\.org/, 'sitemap XML must be valid in structure');
assert.match(sitemap, new RegExp(siteUrl.replace(/[.*+?^$()|[\]\\]/g, '\\$&') + '/articles/'), 'sitemap must contain absolute editorial article URLs');
assert.match(sitemap, new RegExp(siteUrl.replace(/[.*+?^$()|[\]\\]/g, '\\$&') + '/companies/'), 'sitemap must contain public catalogue pages');
assert.doesNotMatch(sitemap, /\/control\/|\/watchlist\//, 'private routes must not be submitted for indexing');
assert.match(robots, new RegExp('Sitemap: ' + siteUrl.replace(/[.*+?^$()|[\]\\]/g, '\\$&') + '/sitemap\\.xml'), 'robots.txt must point to the exact sitemap');

const home = await readFile(new URL('index.html', dist), 'utf8');
assert.match(home, /<title>FORDEX — индекс AI-бизнеса России<\/title>/, 'home page title must be rendered into HTML');
assert.match(home, new RegExp(siteUrl.replace(/[.*+?^$()|[\]\\]/g, '\\$&') + '/'), 'home page canonical must use the production URL');
assert.match(home, /fordex-structured-data/, 'home page must contain JSON-LD');

for (const [route, page] of Object.entries(SEO_PAGES)) {
  const path = route === 'home' ? 'index.html' : route + '/index.html';
  const html = await readFile(new URL(path, dist), 'utf8');
  assert.ok(html.includes('<title>' + page.title), route + ' must have a route-specific title');
  assert.match(html, /rel="canonical"/, route + ' must have canonical URL');
  if (page.noindex) assert.match(html, /name="robots" content="noindex, nofollow"/, route + ' must be noindex');
  else {
    const routeUrl = route === 'home' ? siteUrl + '/' : siteUrl + '/' + route + '/';
    assert.ok(sitemap.includes('<loc>' + routeUrl + '</loc>'), route + ' must be in sitemap');
  }
}

for (const article of editorialArticles.filter((item) => item?.id && item?.title)) {
  const slug = encodeURIComponent(article.id);
  const html = await readFile(new URL('articles/' + slug + '/index.html', dist), 'utf8');
  assert.ok(html.includes('<title>' + article.title + ' — FORDEX</title>'), 'article page must have unique title: ' + article.id);
  assert.ok(html.includes('<link rel="canonical" href="' + siteUrl + '/articles/' + slug + '/"'), 'article canonical must be absolute: ' + article.id);
  assert.ok(html.includes('"@type":"Article"'), 'article page must contain Article JSON-LD: ' + article.id);
}
console.log('SEO output verification passed: sitemap (' + (sitemap.match(/<loc>/g) || []).length + ' URLs), ' + Object.keys(SEO_PAGES).length + ' route snapshots, ' + editorialArticles.length + ' editorial records checked.');
