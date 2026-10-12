import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), '..', 'dist');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
  '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8',
};

export function createPreviewServer({ root = defaultRoot } = {}) {
  const gameRoot = path.resolve(root);
  return http.createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/__journey_health__') {
        const health = JSON.stringify({ app: 'world-game', version: '0.1.0' });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(health), 'Cache-Control': 'no-store' });
        res.end(req.method === 'HEAD' ? undefined : health);
        return;
      }
      let relative;
      try {
        relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
      } catch {
        res.writeHead(400);
        res.end('Invalid URL');
        return;
      }
      const file = path.resolve(gameRoot, relative);
      if (file !== gameRoot && !file.startsWith(gameRoot + path.sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const data = await fs.readFile(file);
      res.writeHead(200, {
        'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': data.length, 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      res.writeHead(404);
      res.end(req.method === 'HEAD' ? undefined : 'Not found');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const portArgument = process.argv.indexOf('--port');
  const port = Number(portArgument === -1 ? process.env.PORT || 4173 : process.argv[portArgument + 1]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('The preview port must be a number between 1 and 65535.');
    process.exitCode = 1;
  } else {
    const server = createPreviewServer();
    server.on('error', error => {
      console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use.` : error.message);
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => console.log(`World Game: http://localhost:${port}/`));
  }
}
