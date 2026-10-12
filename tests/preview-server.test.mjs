import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { request } from 'node:http';
import { createPreviewServer } from '../scripts/preview-server.mjs';

function readResponse(url, { method = 'GET' } = {}) {
  return new Promise((resolve, reject) => {
    const incoming = request(url, { method }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
      response.on('error', reject);
    });
    incoming.on('error', reject);
    incoming.setTimeout(2000, () => incoming.destroy(new Error('Local preview request timed out')));
    incoming.end();
  });
}

test('PC preview serves the game, media, and a bounded launcher health check', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'world-game-preview-'));
  await writeFile(path.join(root, 'index.html'), '<title>World Game</title>');
  await writeFile(path.join(root, 'sample.wav'), Buffer.from([0, 1, 2]));
  const server = createPreviewServer({ root });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await readResponse(origin + '/__journey_health__');
    assert.equal(health.status, 200);
    assert.equal(JSON.parse(health.body.toString()).app, 'world-game');
    assert.equal((await readResponse(origin + '/')).body.toString(), '<title>World Game</title>');
    const audio = await readResponse(origin + '/sample.wav');
    assert.equal(audio.headers['content-type'], 'audio/wav');
    assert.equal(audio.body.byteLength, 3);
    const head = await readResponse(origin + '/sample.wav', { method: 'HEAD' });
    assert.equal(head.headers['content-length'], '3');
    assert.equal(head.body.toString(), '');
    assert.equal((await readResponse(origin + '/missing')).status, 404);
    assert.equal((await readResponse(origin + '/', { method: 'POST' })).status, 405);
    assert.equal((await readResponse(origin + '/%E0%A4%A')).status, 400);
    assert.equal((await readResponse(origin + '/..%2fsecret.txt')).status, 403);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
