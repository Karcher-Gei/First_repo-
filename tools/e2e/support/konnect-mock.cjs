// Local stand-in for Konnect's payment API, mirroring the shapes in apps/server/src/plugins/konnect-payment/types.ts.
// /pay/:ref plays the shopper paying: it calls the webhook, then redirects to successUrl (or failUrl with ?fail=1).
const http = require('http');
const payments = new Map();
let n = 0;
http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost:4010');
    const json = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (req.method === 'POST' && url.pathname === '/api/v2/payments/init-payment') {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw);
      const ref = `ref${++n}`;
      payments.set(ref, { ...body, status: 'pending' });
      console.log(
        'init-payment',
        ref,
        body.orderId,
        body.amount,
        req.headers['x-api-key'] ? 'key' : 'no-key',
      );
      return json(200, { payUrl: `http://localhost:4010/pay/${ref}`, paymentRef: ref });
    }
    let m = /^\/api\/v2\/payments\/(\w+)$/.exec(url.pathname);
    if (req.method === 'GET' && m && payments.has(m[1])) {
      const p = payments.get(m[1]);
      return json(200, {
        payment: { id: m[1], status: p.status, amount: p.amount, orderId: p.orderId },
      });
    }
    m = /^\/pay\/(\w+)$/.exec(url.pathname);
    if (m && payments.has(m[1])) {
      const p = payments.get(m[1]);
      const fail = url.searchParams.has('fail');
      p.status = fail ? 'failed' : 'completed';
      const hook = await fetch(`${p.webhook}?payment_ref=${m[1]}`);
      console.log('webhook', m[1], p.status, hook.status);
      res.writeHead(302, { location: fail ? p.failUrl : p.successUrl });
      return res.end();
    }
    json(404, { error: 'not found' });
  })
  .listen(4010, () => console.log('konnect mock on 4010'));
