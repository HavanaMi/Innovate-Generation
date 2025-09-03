// /api/price-check.js
const Stripe = require('stripe');

module.exports = async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
    const account = await stripe.accounts.retrieve();
    const mode = process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST';

    // prosta obsługa ?id=... bez zależności
    const url = req.url || '';
    const id = (req.query && req.query.id) ||
               (url.includes('id=') ? decodeURIComponent(url.split('id=')[1].split('&')[0]) : '');

    let price = null;
    if (id) {
      price = await stripe.prices.retrieve(id);
    }

    res.status(200).json({ account: account.id, mode, id, price });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
