'use strict';

const Stripe = require('stripe');

// Dozwolone domeny frontendu
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
  // opcjonalnie: max-age dla preflight
  res.setHeader('Access-Control-Max-Age', '86400');
}

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Walidacja i mapowanie pozycji
    const line_items = items.map((it) => {
      if (typeof it.priceId !== 'string' || !/^price_[A-Za-z0-9]+$/.test(it.priceId)) {
        throw new Error('Invalid priceId: ' + String(it.priceId));
      }
      const qty = Math.max(1, Math.min(10, parseInt(it.qty || 1, 10)));
      return { price: it.priceId, quantity: qty };
    });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    // Ustal adres powrotu (ta sama domena co frontend, jeśli jest na liście)
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const apiOrigin = `${proto}://${host}`;
    const originHeader = req.headers.origin || '';
    const uiOrigin = ALLOWED_ORIGINS.includes(originHeader) ? originHeader : apiOrigin;

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

    return res.status(200).json({ url: session.url });
  } catch (err) {
    // Zwróć czytelną informację – przydatne do diagnostyki
    return res.status(400).json({ error: err.message || 'Checkout error' });
  }
};



