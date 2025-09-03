'use strict';
const Stripe = require('stripe');

module.exports = async (req, res) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
    const account = await stripe.accounts.retrieve();
    const mode = (process.env.STRIPE_SECRET_KEY || '').includes('_test_') ? 'TEST' : 'LIVE';

    const id = (req.query.price || '').trim();
    if (!id) {
      return res.status(200).json({ account: account.id, mode, id: '', price: null });
    }

    const price = await stripe.prices.retrieve(id);
    return res.status(200).json({ account: account.id, mode, id, price });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'error' });
  }
};

