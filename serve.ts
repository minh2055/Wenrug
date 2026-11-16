// Emberfall — tiny static server for local testing only.
// Serves game/ at the root so the game plays exactly as any static host
// would serve it. Run: node serve.ts, then open http://localhost:8080

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, 'game');
const port = Number(process.env.PORT ?? 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const file = path === '/' ? 'index.html' : path.replace(/^\/+/, '');
  const full = join(root, file);
  if (!full.startsWith(root) || !existsSync(full) || !statSync(full).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found\n');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(full)] ?? 'application/octet-stream' });
  res.end(readFileSync(full));
});

server.listen(port, () => {
  console.log(`Emberfall served at http://localhost:${port}`);
});
