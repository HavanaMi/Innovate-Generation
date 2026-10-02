# Offline checkout regression checks

Run from the repository root with Node.js 22 or newer:

```sh
node --test tests/checkout.test.cjs
```

The suite executes the actual CommonJS API handler and the actual inline scripts
from `index.html`, `shop.html`, `cart.html` and `success.html`. Stripe, DOM events,
localStorage, timers and fetch responses are in-memory stubs. It needs no npm
install, Stripe SDK, API key, GitHub secret or live/test Stripe session.

It checks every purchase button's price ID (including the three homepage
products), exact catalog/allowlist parity, product-to-cart data, POST payloads,
Stripe line items and quantity limits, return URLs for GitHub Pages/custom
domains/Vercel, and payment verification. Redirecting, cancelling, unpaid
responses, malformed responses and network errors must preserve cart storage.
Only a successful verification response with the boolean `paid === true` may
clear it; pending verification must preserve it too.

GitHub Actions runs this command on pull requests, pushes to `main`, and manual
dispatch, with read-only repository permissions and pinned setup actions.

This is a source-level contract check with a small DOM harness, not a real
browser or Stripe integration test. It cannot confirm that prices are active
in the Stripe account, deployed environment variables, real CORS behaviour,
shipping rates, receipts or an actual payment. Extend the harness if checkout
scripts move to external files or their DOM structure changes.
