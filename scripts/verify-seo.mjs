import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const generator = await readFile(new URL('./generate-seo.mjs', import.meta.url), 'utf8');
const seoPages = await readFile(new URL('../src/data/seo.js', import.meta.url), 'utf8');
const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');

assert.match(html, /<html lang="ru">/, 'document language must be Russian');
assert.match(html, /name="description"/, 'document must provide a description');
assert.match(html, /property="og:title"/, 'document must provide Open Graph defaults');
assert.match(html, /rel="icon".*favicon\.svg/, 'document must reference its favicon');
assert.match(app, /function routeToPath\(/, 'routes must have stable path URLs');
assert.match(seoPages, /\babout\s*:/, 'the public FORDEX about page must have SEO metadata');
assert.match(app, /'\/about': 'about'/, 'the about page must resolve on its stable path');
assert.match(app, /function About\(\)/, 'the about page must render project principles and limitations');
assert.match(app, /route === 'about' && <About \/>/, 'the app must render the about page for its route');
assert.match(generator, /route\.key === 'about'/, 'the initial HTML must include meaningful about-page content');
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


function runProductionSeoBuild(siteUrl) {
  return spawnSync(process.execPath, ['scripts/generate-seo.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, SITE_URL: siteUrl, VERCEL_ENV: 'production' },
  });
}

const missingSiteUrl = runProductionSeoBuild('');
assert.notEqual(missingSiteUrl.status, 0, 'production build must fail when SITE_URL is missing');
assert.match(missingSiteUrl.stderr, /SITE_URL is required for a production deployment/, 'missing production SITE_URL must explain how to fix it');

const placeholderSiteUrl = runProductionSeoBuild('https://fordex.example.invalid');
assert.notEqual(placeholderSiteUrl.status, 0, 'production build must reject placeholder hostnames');
assert.match(placeholderSiteUrl.stderr, /real public hostname, not a placeholder or local address/, 'placeholder hostname failure must be explicit');

const insecureSiteUrl = runProductionSeoBuild('http://fordex.ai');
assert.notEqual(insecureSiteUrl.status, 0, 'production build must reject non-HTTPS SITE_URL');
assert.match(insecureSiteUrl.stderr, /SITE_URL must use HTTPS in a production deployment/, 'HTTPS failure must be explicit');

console.log('Production SEO guard verified: missing, placeholder, and non-HTTPS SITE_URL values are rejected.');
