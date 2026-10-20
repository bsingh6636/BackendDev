# BackendDev

For requests whose `Host` is `faphouse3.com` or `www.faphouse3.com`, the backend
calls the deployed Lambda and serves its response directly, including HTML,
assets, and the `/api/track` beacon. The path, query string, method, body, and
visitor headers are forwarded. Other domains continue using the portfolio API.

The default Lambda URL is
`https://qr3rjkq2cgl6s6kygoltoxzmhe0qznjd.lambda-url.ap-south-1.on.aws/`.
Optionally set `DOMAIN3_LAMBDA_URL` in the server environment to override it.
No external Vercel rewrite or browser redirect to the Lambda URL is used.
The Lambda source is in `../domain3-traffic-redirector`; it does not need to be
copied or deployed again for this integration.

Run `npm start` and request the server with `Host: faphouse3.com` to check the
Lambda response. On deployment, the custom domain must reach this backend.
The Lambda call requires Node.js 20 or later and times out after 15 seconds.

Run `node --test` for integration checks using a local mock Lambda server.
