// api/whoami.js
'use strict';
const Stripe = require('stripe');

module.exports = async (req, res) => {
  const sk = process.env.STRIPE_SECRET_KEY || '';
  let account = 'unknown';
  const mode = sk.startsWith('sk_live_') ? 'LIVE' :
               sk.startsWith('sk_test_') ? 'TEST' : 'unknown';

  try {
    const stripe = new Stripe(sk);
    const acc = await stripe.accounts.retrieve();
    account = acc.id;
  } catch {}

  res.status(200).json({
    vercelEnv: process.env.VERCEL_ENV,
    projectUrl: process.env.VERCEL_URL,
    account,                 // ← tu zobaczysz acct_…
    mode,
    sk_prefix: sk ? sk.slice(0, 12) + '…' : null
  });
};

