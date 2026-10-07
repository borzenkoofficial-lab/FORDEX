import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

const API_PORT = Number(process.env.FORDEX_API_PORT || 3001);
const VITE_PORT = Number(process.env.FORDEX_WEB_PORT || 5173);

const handlers = new Map([
  ['/api/ai/research', () => import('../api/ai/research.js')],
  ['/api/ai/editor', () => import('../api/ai/editor.js')],
]);

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function createResponse(res) {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { res.setHeader(name, value); return this; },
    end(body) {
      if (!res.headersSent && !res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.statusCode = this.statusCode;
      res.end(body);
    },
  };
}

const apiServer = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname;
    const loader = handlers.get(pathname);
    if (!loader) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'API_ROUTE_NOT_FOUND', path: pathname }));
      return;
    }

    const module = await loader();
    const request = {
      method: req.method,
      headers: req.headers,
      body: await readBody(req),
      url: req.url,
    };
    await module.default(request, createResponse(res));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : 'DEV_API_SERVER_ERROR',
    }));
  }
});

await new Promise((resolveListen, reject) => {
  apiServer.once('error', reject);
  apiServer.listen(API_PORT, '127.0.0.1', resolveListen);
});

console.log('FORDEX API listening on http://127.0.0.1:' + API_PORT);

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const viteProcess = spawn(
  npmCommand,
  ['run', 'dev:client', '--', '--host', '0.0.0.0', '--port', String(VITE_PORT)],
  { stdio: 'inherit', env: process.env },
);

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  apiServer.close();
  viteProcess.kill('SIGTERM');
  setTimeout(() => process.exit(code), 1000).unref();
}
viteProcess.on('exit', (code, signal) => {
  if (!shuttingDown) shutdown(code ?? 1);
});
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
