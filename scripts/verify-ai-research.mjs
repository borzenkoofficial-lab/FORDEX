import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../api/ai/research.js', import.meta.url), 'utf8');
const required = [
  'news.google.com/rss/search',
  'RESEARCH_READY',
  'sourceCount',
  'publishedAt',
  'sourceName',
  'MAX_ITEMS',
];
for (const token of required) {
  if (!source.includes(token)) throw new Error('RESEARCH_ADAPTER_MISSING: ' + token);
}
if (!source.includes('METHOD_NOT_ALLOWED')) throw new Error('RESEARCH_ADAPTER_METHOD_GUARD_MISSING');
if (!source.includes("mode === 'CREATE_POST'")) throw new Error('CREATE_POST_MODE_MISSING');
if (!source.includes('registryCandidates.map')) throw new Error('REGISTRY_TARGETED_QUERIES_MISSING');
if (!source.includes('const relevantSources = enrichedSources.filter')) throw new Error('SOURCE_RELEVANCE_GATE_MISSING');
if (source.includes('relevantSources.length ? relevantSources : enrichedSources')) {
  throw new Error('PERMISSIVE_SOURCE_FALLBACK_PRESENT');
}
console.log('AI research adapter verification passed');
