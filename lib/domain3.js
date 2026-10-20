const DEFAULT_LAMBDA_URL = 'https://qr3rjkq2cgl6s6kygoltoxzmhe0qznjd.lambda-url.ap-south-1.on.aws/';
const DOMAIN3_HOSTS = new Set(['faphouse3.com', 'www.faphouse3.com']);
const HOP_BY_HOP_HEADERS = [
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
];

function excludedHeaders(headers) {
  return new Set([
    ...HOP_BY_HOP_HEADERS,
    ...(headers.get('connection') || '').split(',').map(name => name.trim().toLowerCase()),
    'host', 'content-length',
  ]);
}

// Returns true when the Lambda response has been served; false for other domains.
export async function serveDomain3(req, res) {
  const hostname = (req.headers.host || '').toLowerCase().split(':')[0].replace(/\.$/, '');
  if (!DOMAIN3_HOSTS.has(hostname)) return false;

  try {
    const target = new URL(process.env.DOMAIN3_LAMBDA_URL || DEFAULT_LAMBDA_URL);
    // Assign path/search separately so a path beginning with // cannot change the upstream host.
    const requestUrl = req.originalUrl || req.url || '/';
    const queryIndex = requestUrl.indexOf('?');
    target.pathname = queryIndex < 0 ? requestUrl : requestUrl.slice(0, queryIndex);
    target.search = queryIndex < 0 ? '' : requestUrl.slice(queryIndex);

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    }
    for (const name of excludedHeaders(headers)) headers.delete(name);
    headers.set('accept-encoding', 'identity');
    headers.set('x-forwarded-host', hostname);
    if (!headers.has('x-forwarded-for') && req.socket?.remoteAddress) {
      headers.set('x-forwarded-for', req.socket.remoteAddress);
    }

    const options = {
      method: req.method,
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // Vercel may parse the body already; Express passes the untouched request stream.
      options.body = req.body === undefined ? req
        : typeof req.body === 'string' || Buffer.isBuffer(req.body) ? req.body
          : JSON.stringify(req.body);
      options.duplex = 'half';
    }

    const upstream = await fetch(target, options);
    const body = Buffer.from(await upstream.arrayBuffer());
    const excluded = excludedHeaders(upstream.headers);
    // fetch decodes compressed bodies; do not send stale encoding/length headers.
    excluded.add('content-encoding');
    excluded.add('set-cookie');
    upstream.headers.forEach((value, name) => {
      if (!excluded.has(name)) res.setHeader(name, value);
    });
    const cookies = upstream.headers.getSetCookie();
    if (cookies.length) res.setHeader('set-cookie', cookies);
    res.statusCode = upstream.status;
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    console.error('Domain3 Lambda request failed:', error.message);
    res.statusCode = ['TimeoutError', 'AbortError'].includes(error.name) ? 504 : 502;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ message: 'Domain3 service temporarily unavailable' }));
  }
  return true;
}
