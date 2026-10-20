import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { gzipSync } from 'node:zlib';
import { test } from 'node:test';
import express from 'express';

async function listen(handler) {
  const server = http.createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}

function request(server, { path = '/', host = 'faphouse3.com', method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port: server.address().port,
      path, method, headers: { host, ...headers },
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

test('backend serves deployed Lambda responses for domain3', async t => {
  const previous = { VERCEL: process.env.VERCEL, DOMAIN3_LAMBDA_URL: process.env.DOMAIN3_LAMBDA_URL };
  const servers = [];
  t.after(async () => {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    await Promise.all(servers.map(server => new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections();
    })));
  });

  const upstream = await listen(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    if (req.url === '/compressed') {
      res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Encoding': 'gzip' });
      res.end(gzipSync('<html>Lambda HTML</html>'));
    } else if (req.url === '/style.css') {
      res.writeHead(200, { 'Content-Type': 'text/css', 'Cache-Control': 'public, max-age=86400' });
      res.end('body { color: gold; }');
    } else if (req.url === '/missing') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Lambda not found');
    } else {
      res.writeHead(202, { 'Content-Type': 'application/json', 'Set-Cookie': ['a=1; Path=/', 'b=2; Path=/'] });
      res.end(JSON.stringify({ path: req.url, method: req.method, headers: req.headers, body }));
    }
  });
  servers.push(upstream);
  const lambdaUrl = `http://127.0.0.1:${upstream.address().port}/`;
  process.env.DOMAIN3_LAMBDA_URL = lambdaUrl;
  process.env.VERCEL = '1';
  const { default: handler } = await import('../index.js');
  const backend = await listen(handler);
  servers.push(backend);

  await t.test('serves HTML, decoded compression, assets, and upstream errors', async () => {
    const html = await request(backend, { path: '/compressed' });
    assert.equal(html.status, 200);
    assert.equal(html.body, '<html>Lambda HTML</html>');
    assert.equal(html.headers['content-encoding'], undefined);
    assert.match(html.headers['content-type'], /text\/html/);
    const css = await request(backend, { path: '/style.css', host: 'WWW.FAPHOUSE3.COM:443' });
    assert.equal(css.body, 'body { color: gold; }');
    assert.equal(css.headers['cache-control'], 'public, max-age=86400');
    const missing = await request(backend, { path: '/missing' });
    assert.equal(missing.status, 404);
    assert.equal(missing.body, 'Lambda not found');
  });

  await t.test('preserves nested path/query, cookies, visitor headers and HEAD', async () => {
    const result = await request(backend, {
      path: '/watch/example?source=a%2Fb&tag=1&tag=2',
      headers: { 'cf-connecting-ip': '203.0.113.2', 'cf-ipcountry': 'IN', 'user-agent': 'test-browser' },
    });
    const data = JSON.parse(result.body);
    assert.equal(data.path, '/watch/example?source=a%2Fb&tag=1&tag=2');
    assert.equal(data.headers['cf-connecting-ip'], '203.0.113.2');
    assert.equal(data.headers['cf-ipcountry'], 'IN');
    assert.equal(data.headers['user-agent'], 'test-browser');
    assert.equal(data.headers['x-forwarded-host'], 'faphouse3.com');
    assert.deepEqual(result.headers['set-cookie'], ['a=1; Path=/', 'b=2; Path=/']);
    const head = await request(backend, { method: 'HEAD', path: '/style.css' });
    assert.equal(head.status, 200);
    assert.equal(head.body, '');
  });

  await t.test('forwards raw tracking beacons and OPTIONS before portfolio middleware', async () => {
    const body = '{"path":"/watch/example","search":"?tag=1"}';
    const result = await request(backend, {
      path: '/api/track', method: 'POST', body,
      headers: { 'content-type': 'text/plain;charset=UTF-8' },
    });
    assert.equal(result.status, 202);
    assert.equal(JSON.parse(result.body).body, body);
    const options = await request(backend, { path: '/api/track', method: 'OPTIONS' });
    assert.equal(JSON.parse(options.body).method, 'OPTIONS');
  });

  await t.test('other domains retain portfolio responses, even with a domain3 Origin', async () => {
    for (const host of ['brijeshhq.com', 'localhost', 'faphouse3.com.evil.example']) {
      const result = await request(backend, { host, headers: { origin: 'https://faphouse3.com' } });
      assert.equal(result.status, 200);
      assert.equal(JSON.parse(result.body).service, 'Portfolio Backend API');
    }
  });

  await t.test('direct serverless API handlers also serve Lambda with parsed bodies', async () => {
    const { default: resume } = await import('../api/resume.js');
    const { default: contact } = await import('../api/contact.js');
    const api = express();
    api.use(express.json());
    api.all('/api/resume', resume);
    api.all('/api/contact', contact);
    const serverless = await listen(api);
    servers.push(serverless);
    for (const path of ['/api/resume', '/api/contact']) {
      const result = await request(serverless, {
        path, method: 'POST', body: '{"example":true}', headers: { 'content-type': 'application/json' },
      });
      assert.equal(result.status, 202);
      assert.deepEqual(JSON.parse(JSON.parse(result.body).body), { example: true });
    }
    const portfolio = await request(serverless, { path: '/api/resume', host: 'brijeshhq.com', method: 'OPTIONS' });
    assert.equal(portfolio.status, 200);
  });

  await t.test('upstream failures return a controlled gateway error', async () => {
    process.env.DOMAIN3_LAMBDA_URL = 'unsupported://lambda/';
    const result = await request(backend);
    assert.equal(result.status, 502);
    assert.equal(JSON.parse(result.body).message, 'Domain3 service temporarily unavailable');
    assert.equal(result.headers['cache-control'], 'no-store');
    process.env.DOMAIN3_LAMBDA_URL = lambdaUrl;
  });
});
