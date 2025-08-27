// api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items' });
    }

    const line_items = items.map(i => ({
      price: i.priceId,
      quantity: Math.max(1, parseInt(i.qty || 1, 10)),
      adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 }
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      shipping_options: [{ shipping_rate: 'shr_xxxxxxxx' }], // podmień na swój Shipping rate ID
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['GB','IE','PL','DE','FR','ES','IT','US'] },
      success_url: 'https://YOUR-VERCEL-URL.vercel.app/success.html',
      cancel_url:  'https://YOUR-VERCEL-URL.vercel.app/cart.html'
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
