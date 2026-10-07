import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../api/ai/editor.js', import.meta.url), 'utf8');

const required = [
  "process.env.ANYMODEL_API_KEY",
  "process.env.OPENAI_API_KEY",
  "'/responses'",
  'approvalRequired: true',
  'canPublish: false',
  'canOverrideScore: false',
  'canChangeFormula: false',
  "'x-fordex-test-key',"
];

for (const token of required) {
  if (!source.includes(token)) throw new Error(`RUNTIME_GATEWAY_MISSING: ${token}`);
}

const forbidden = [
  'VITE_AI_API_KEY',
  'import.meta.env.ANYMODEL_API_KEY',
  'import.meta.env.OPENAI_API_KEY',
];

for (const token of forbidden) {
  if (source.includes(token)) throw new Error(`CLIENT_SECRET_LEAK_PATTERN: ${token}`);
}

console.log('Runtime gateway verification passed');
