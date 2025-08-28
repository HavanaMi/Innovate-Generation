// api/create-checkout-session.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // --- CORS (front na innovategeneration.com, API na Vercel) ---
  const allowed = (process.env.CORS_ORIGIN || 'https://www.innovategeneration.com,https://innovategeneration.com')
    .split(',')
    .map(s => s.trim());
  const origin = req.headers.origin;
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  // -------------------------------------------------------------

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items' });
    }

    // oczekujemy: [{ priceId, qty }]
    const line_items = items.map(({ priceId, qty }) => ({
      price: priceId,
      quantity: Math.max(1, parseInt(qty || 1, 10)),
      adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 }
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: (process.env.ALLOWED_COUNTRIES || 'GB').split(',')
      },
      // użyj stawki wysyłki z ENV (ID: shr_...)
      shipping_options: [
        { shipping_rate: process.env.SHIPPING_RATE_STANDARD }
      ],
      success_url: process.env.SUCCESS_URL,
      cancel_url:  process.env.CANCEL_URL
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

