'use strict';

const Stripe = require('stripe');

const ALLOWED_ORIGINS = [
  'https://www.innovategeneration.com',
  'https://innovategeneration.com',
  'https://inno-gen-dusky.vercel.app',
  'https://havanami.github.io',
];
const ALLOWED_PRICE_IDS = new Set([
  'price_1RtxYNBaMwJkUgdcPtZRzUYw',
  'price_1Rtwp2BaMwJkUgdcnoJXrMxy',
  'price_1RtwnUBaMwJkUgdc7JTJahTg',
  'price_1RtwjjBaMwJkUgdcDfcOKnXK',
  'price_1RtwiIBaMwJkUgdcP9oiRwTQ',
  'price_1RtwgpBaMwJkUgdccWLBTDHb',
  'price_1RtwcDBaMwJkUgdcwLI3DObA',
  'price_1RtwYiBaMwJkUgdcJ80SKa1Q',
  'price_1RtwX3BaMwJkUgdcmIe8FgqK',
  'price_1RtwQVBaMwJkUgdcQHLgqlPx',
  'price_1RtwG8BaMwJkUgdcnV26Rq2G',
]);

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function getUiBase(req) {
  const origin = req.headers.origin || '';
  const uiOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : '';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const apiOrigin = `${proto}://${host}`;
  const base = uiOrigin || apiOrigin;
  return origin === 'https://havanami.github.io'
    ? base + '/Innovate-Generation'
    : base;
}

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    if (req.method === 'GET') {
      const sessionId = req.query && req.query.session_id;
      if (typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9]+$/.test(sessionId)) {
        return res.status(400).json({ error: 'Invalid session_id' });
      }
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return res.status(200).json({
        paid: session.status === 'complete' && session.payment_status === 'paid',
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const line_items = items.map((it) => {
      if (!it || typeof it.priceId !== 'string' || !ALLOWED_PRICE_IDS.has(it.priceId)) {
        throw new Error('Invalid product');
      }
      const requestedQty = Number.parseInt(it.qty || 1, 10);
      if (!Number.isFinite(requestedQty)) throw new Error('Invalid quantity');
      const qty = Math.max(1, Math.min(10, requestedQty));
      return { price: it.priceId, quantity: qty };
    });

    const uiBase = getUiBase(req);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${uiBase}/success.html?session_id={CHECKOUT_SESSION_ID}`, 
      cancel_url: `${uiBase}/cart.html`,
      shipping_address_collection: {
        allowed_countries: ['GB','IE','FR','DE','ES','IT','PL','NL','BE','US','AE'],
      },
      shipping_options: process.env.SHIPPING_RATE_ID
        ? [{ shipping_rate: process.env.SHIPPING_RATE_ID }]
        : undefined,
      invoice_creation: { enabled: true },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Checkout error' });
  }
};
