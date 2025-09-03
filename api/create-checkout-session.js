// api/create-checkout-session.js  (albo api/checkout.js – patrz uwaga powyżej)
'use strict';

const Stripe = require('stripe');

// Domeny, z których wolno wołać API
const ALLOWED_ORIGINS = [
  'https://www.innovategeneration.com',
  'https://innovategeneration.com',
  'https://inno-gen-dusky.vercel.app',
];

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = async (req, res) => {
  setCors(req, res);

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parsowanie body (Vercel zwykle już parsuje JSON)
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Walidacja pozycji
    const line_items = items.map((it) => {
      if (typeof it.priceId !== 'string' || !/^price_[A-Za-z0-9]+$/.test(it.priceId)) {
        throw new Error('Invalid priceId: ' + String(it.priceId));
      }
      const quantity = Math.max(1, Math.min(10, parseInt(it.qty || 1, 10)));
      return { price: it.priceId, quantity };
    });

    // Ustalenie originu do powrotu z checkoutu
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const apiOrigin = `${proto}://${host}`;

    const originHeader = req.headers.origin || '';
    const uiOrigin = ALLOWED_ORIGINS.includes(originHeader) ? originHeader : apiOrigin;

    // Stripe
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      throw new Error('Missing STRIPE_SECRET_KEY env var');
    }

    const stripe = new Stripe(secret, { apiVersion: '2024-06-20' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${uiOrigin}/success.html`,
      cancel_url: `${uiOrigin}/cart.html`,
      shipping_address_collection: {
        allowed_countries: ['GB','IE','FR','DE','ES','IT','PL','NL','BE','US','AE'],
      },
      shipping_options: process.env.SHIPPING_RATE_ID
        ? [{ shipping_rate: process.env.SHIPPING_RATE_ID }]
        : undefined,
      invoice_creation: { enabled: true },
    });

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('[checkout] error:', err);
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: err.message || 'Checkout error' });
  }
};


