/**
 * Lightweight Stripe proxy server.
 * Run: node server/stripe-proxy.mjs
 * Requires: STRIPE_SECRET_KEY env variable
 *
 * Why: Stripe API cannot be called directly from a browser (CORS + secret key exposure).
 * This proxy runs locally and exposes a simple REST endpoint for the dashboard.
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = 3001;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_KEY) {
  console.warn('[stripe-proxy] WARNING: STRIPE_SECRET_KEY not set — all requests will return empty arrays');
}

function stripeGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      `https://api.stripe.com${path}`,
      {
        headers: {
          Authorization: `Bearer ${STRIPE_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('Invalid JSON from Stripe'));
          }
        });
      }
    );
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/stripe/charges') {
    if (!STRIPE_KEY) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
      return;
    }

    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';
    const params = new URLSearchParams({ limit: '100' });
    if (from) params.set('created[gte]', from);
    if (to) params.set('created[lte]', to);

    try {
      const data = await stripeGet(`/v1/charges?${params}`);
      const charges = (data.data || []).map((c) => ({
        id: c.id,
        amount: c.amount,
        currency: c.currency,
        description: c.description,
        created: c.created,
        status: c.status,
        metadata: c.metadata || {},
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(charges));
    } catch (err) {
      console.error('Stripe error:', err);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (url.pathname === '/stripe/balance') {
    if (!STRIPE_KEY) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ available: 0, pending: 0 }));
      return;
    }
    try {
      const data = await stripeGet('/v1/balance');
      const eur = (arr) => (arr?.find((b) => b.currency === 'eur')?.amount || 0) / 100;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ available: eur(data.available), pending: eur(data.pending) }));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`[stripe-proxy] Running on http://localhost:${PORT}`);
  console.log(`[stripe-proxy] Stripe key: ${STRIPE_KEY ? '✓ configured' : '✗ not set (mock mode)'}`);
});
