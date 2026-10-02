'use strict';

// Run the real handler and inline scripts with in-memory Stripe, DOM and storage.
// No npm install, Stripe SDK, credentials, network calls or payments are needed.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const read = file => readFileSync(join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const CART_KEY = 'ig_cart_v2';
const API_ORIGIN = 'https://inno-gen-dusky.vercel.app';
const CHECKOUT_URL = 'https://checkout.stripe.com/offline-stub';
const origins = [
  ['https://havanami.github.io', 'https://havanami.github.io/Innovate-Generation'],
  ['https://www.innovategeneration.com', 'https://www.innovategeneration.com'],
  ['https://innovategeneration.com', 'https://innovategeneration.com'],
  [API_ORIGIN, API_ORIGIN],
];

// These pages use simple, quoted HTML attributes. Fail explicitly if their
// scripts move to external files, rather than silently skipping checkout code.
function tags(html) {
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  return [...html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)].map(match => ({
    tag: match[1], start: match.index,
    attrs: Object.fromEntries([...match[2].matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
      .map(attr => [attr[1], attr[2] ?? attr[3]])),
  }));
}
const hasClass = (attrs, name) => (attrs.class || '').split(/\s+/).includes(name);

function catalog() {
  return ['shop.html', 'index.html'].flatMap(file => {
    const markup = tags(read(file));
    const cards = markup.filter(tag => hasClass(tag.attrs, 'product-item'));
    const buttons = markup.filter(tag => tag.tag === 'button' && hasClass(tag.attrs, 'add-to-cart'));
    assert.ok(buttons.length > 0, `${file}: no Add to cart buttons found`);
    if (file === 'shop.html') assert.equal(buttons.length, cards.length, 'Each shop product needs a purchase button');
    return buttons.map(button => {
      const attrs = file === 'shop.html'
        ? cards.filter(card => card.start < button.start).at(-1)?.attrs
        : button.attrs;
      assert.ok(attrs, `${file}: product data not found`);
      const priceId = attrs['data-price-id'] || attrs['data-priceid'];
      assert.match(priceId || '', /^price_[A-Za-z0-9]+$/, `${file}: ${attrs['data-id']} has no valid priceId`);
      assert.ok(attrs['data-id'], `${file}: product has no id`);
      return { file, attrs, button: button.attrs, priceId };
    });
  });
}

function backend(session = { status: 'complete', payment_status: 'paid' }) {
  const created = [], retrieved = [];
  class StripeStub {
    constructor(key) {
      assert.equal(key, 'sk_test_offline_stub');
      this.checkout = { sessions: {
        create: async options => { created.push(plain(options)); return { url: CHECKOUT_URL }; },
        retrieve: async id => { retrieved.push(id); return session; },
      } };
    }
  }
  const context = vm.createContext({
    module: { exports: {} }, process: { env: { STRIPE_SECRET_KEY: 'sk_test_offline_stub' } },
    require: name => { assert.equal(name, 'stripe', 'Unexpected dependency in checkout handler'); return StripeStub; },
  });
  vm.runInContext(read('api/create-checkout-session.js'), context, { filename: 'api/create-checkout-session.js', timeout: 1000 });
  return {
    created, retrieved,
    allowlist: plain(vm.runInContext('Array.from(ALLOWED_PRICE_IDS)', context)),
    async request({ method = 'POST', body, origin = API_ORIGIN, query = {}, headers = {} } = {}) {
      const response = { headers: {}, statusCode: 200,
        setHeader(name, value) { this.headers[name] = value; },
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = plain(data); return this; }, end() { return this; },
      };
      await context.module.exports({ method, body, query,
        headers: { origin, host: 'inno-gen-dusky.vercel.app', ...headers },
      }, response);
      return response;
    },
  };
}

function storage(cart = []) {
  const values = new Map([[CART_KEY, JSON.stringify(cart)]]), writes = [];
  return {
    writes,
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { writes.push([key, String(value)]); values.set(key, String(value)); },
    removeItem(key) { writes.push([key, null]); values.delete(key); },
    clear() { writes.push(['*', null]); values.clear(); },
  };
}

function events() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    async emit(type, event = {}) {
      for (const listener of listeners.get(type) || []) await listener(event);
    },
  };
}
function element(attrs = {}, card = null) {
  const node = { ...events(), id: attrs.id || '', textContent: '', disabled: false, style: {},
    dataset: Object.fromEntries(Object.entries(attrs).filter(([key]) => key.startsWith('data-'))
      .map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value])),
    classList: { contains: name => hasClass(attrs, name) },
    closest(selector) {
      if (selector === '.product-item') return card;
      if (selector === '.add-to-cart') return hasClass(attrs, 'add-to-cart') ? node : null;
      if (selector === 'img[data-zoom]') return null;
      throw new Error(`Unsupported DOM selector: ${selector}`);
    },
  };
  return node;
}
function page(file, { store = storage(), origin = API_ORIGIN, search = '', fetch = () => {
  throw new Error('Unexpected fetch: this test is offline');
} } = {}) {
  const html = read(file), nodes = new Map(tags(html).filter(tag => tag.attrs.id)
    .map(tag => [tag.attrs.id, element(tag.attrs)]));
  const location = { hostname: new URL(origin).hostname, search, href: origin + '/' + file };
  const document = { ...events(), getElementById: id => nodes.get(id) || null };
  const window = { ...events(), location, print() {} };
  const context = vm.createContext({ document, window, location, localStorage: store,
    fetch, URLSearchParams, console: { error() {} }, alert() {},
    setTimeout() { return 1; }, setInterval() { return 1; }, clearInterval() {},
  });
  const pending = [];
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length, `${file}: no inline scripts found`);
  for (const [index, script] of scripts.entries()) {
    assert.doesNotMatch(script[1], /\bsrc\s*=/i, `${file}: extend the harness for external scripts`);
    pending.push(vm.runInContext(script[2], context, { filename: `${file}:script-${index + 1}`, timeout: 1000 }));
  }
  return { store, window, location, done: Promise.all(pending),
    click: target => document.emit('click', { target, preventDefault() {}, stopPropagation() {} }),
  };
}
const response = (body, ok = true) => ({ ok, json: async () => body });
function sampleCart() {
  return catalog().slice(0, 2).map((product, i) => ({
    id: product.attrs['data-id'], priceId: product.priceId, qty: i ? 7 : 2,
    name: product.attrs['data-name'], price: 0.01, image: product.attrs['data-image'],
  }));
}
function retained(store, before) {
  assert.equal(store.getItem(CART_KEY), before, 'Cart changed without verified payment');
  assert.deepEqual(store.writes, [], 'Cart storage was written before verified payment');
}

test('Every purchasable product has a priceId; backend allowlist exactly matches both catalogs', async () => {
  const products = catalog(), api = backend();
  const ids = [...new Set(products.map(product => product.priceId))].sort();
  assert.deepEqual([...new Set(api.allowlist)].sort(), ids);
  const items = products.map((product, i) => ({ priceId: product.priceId, qty: 1 + i % 3, price: 0.01 }));
  const res = await api.request({ body: { items } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(api.created[0].line_items, items.map(item => ({ price: item.priceId, quantity: item.qty })));
});

test('Shop and homepage Add to cart preserve each product priceId and quantity', async () => {
  for (const product of catalog()) {
    const store = storage(sampleCart()), before = JSON.parse(store.getItem(CART_KEY));
    const ui = page(product.file, { store });
    retained(store, JSON.stringify(before));
    const card = element(product.attrs);
    await ui.click(element(product.button, card));
    await ui.done;
    const added = JSON.parse(store.getItem(CART_KEY)).find(item => item.id === product.attrs['data-id']);
    const existing = before.find(item => item.id === added.id);
    assert.equal(added.priceId, product.priceId);
    assert.equal(added.qty, (existing?.qty || 0) + 1);
    assert.ok(before.every(item => JSON.parse(store.getItem(CART_KEY)).some(saved => saved.id === item.id)));
  }
});

test('Backend return URLs use the correct origin, Pages path and literal Stripe session placeholder', async () => {
  for (const [origin, expected] of [...origins, [null, API_ORIGIN], ['https://untrusted.example', API_ORIGIN]]) {
    const api = backend();
    const res = await api.request({ origin, body: { items: [{ priceId: catalog()[0].priceId, qty: 3 }] },
      headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'inno-gen-dusky.vercel.app' },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(api.created[0].mode, 'payment');
    assert.equal(api.created[0].success_url, `${expected}/success.html?session_id={CHECKOUT_SESSION_ID}`);
    assert.equal(api.created[0].cancel_url, `${expected}/cart.html`);
  }
});

test('Backend rejects empty carts, missing/unknown priceId and invalid qty without creating a session', async () => {
  for (const body of [{}, { items: [] }, { items: [null] }, { items: [{ qty: 2 }] },
    { items: [{ priceId: 'price_not_in_catalog', qty: 2 }] },
    { items: [{ priceId: catalog()[0].priceId, qty: 'invalid' }] }]) {
    const api = backend(), res = await api.request({ body });
    assert.equal(res.statusCode, 400);
    assert.equal(api.created.length, 0);
  }
  for (const [qty, expected] of [[-2, 1], [1, 1], [7, 7], [10, 10], [99, 10]]) {
    const api = backend();
    await api.request({ body: JSON.stringify({ items: [{ priceId: catalog()[0].priceId, qty }] }) });
    assert.equal(api.created[0].line_items[0].quantity, expected);
  }
});

test('Cart sends priceId and qty to the right endpoint; redirect, cancellation and errors retain storage', async () => {
  for (const [origin] of origins) {
    for (const outcome of ['redirect', 'http-error', 'network-error', 'invalid-json', 'missing-url']) {
      const cart = sampleCart(), store = storage(cart), before = store.getItem(CART_KEY), api = backend();
      const calls = [];
      const ui = page('cart.html', { origin, store, fetch: async (url, options) => {
        calls.push({ url, options });
        if (outcome === 'network-error') throw new Error('Offline network failure');
        if (outcome === 'invalid-json') return { ok: true, json: async () => { throw new Error('Invalid JSON'); } };
        if (outcome === 'http-error') return response({ error: 'Declined' }, false);
        if (outcome === 'missing-url') return response({});
        const result = await api.request({ origin, body: options.body });
        return response(result.body, result.statusCode === 200);
      } });
      retained(store, before);
      await ui.click(element({ id: 'checkout' }));
      await ui.done;
      assert.equal(calls.length, 1);
      const { url, options } = calls[0];
      assert.equal(url, (origin === API_ORIGIN ? '' : API_ORIGIN) + '/api/create-checkout-session');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(options.body), { items: cart.map(item => ({ priceId: item.priceId, qty: item.qty })) });
      retained(store, before);
      if (outcome === 'redirect') {
        assert.equal(ui.window.location, CHECKOUT_URL);
        // Cancel returns to cart.html. Reopening it must keep the same cart.
        await page('cart.html', { origin, store }).done;
        retained(store, before);
      }
    }
  }
});

test('GET verifies payment: only complete AND paid returns the boolean true', async () => {
  for (const status of ['open', 'complete', 'expired']) {
    for (const payment_status of ['unpaid', 'paid', 'no_payment_required']) {
      const api = backend({ status, payment_status });
      const res = await api.request({ method: 'GET', query: { session_id: 'cs_test_offline' } });
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.paid, status === 'complete' && payment_status === 'paid');
      assert.deepEqual(api.retrieved, ['cs_test_offline']);
      assert.equal(api.created.length, 0);
    }
  }
  const api = backend();
  for (const session_id of [undefined, '', 'not-a-session', ['cs_test_offline']]) {
    assert.equal((await api.request({ method: 'GET', query: { session_id } })).statusCode, 400);
  }
  assert.deepEqual(api.retrieved, []);
});

test('Success keeps cart while verification is pending, then clears only after paid === true', async () => {
  for (const [origin] of origins) {
    const store = storage(sampleCart()), before = store.getItem(CART_KEY), calls = [];
    let confirm;
    const confirmation = new Promise(resolve => { confirm = resolve; });
    const ui = page('success.html', { store, origin, search: '?session_id=cs_test_offline', fetch: async url => {
      calls.push(url); return { ok: true, json: () => confirmation };
    } });
    await Promise.resolve();
    retained(store, before);
    assert.deepEqual(calls, [(origin === API_ORIGIN ? '' : API_ORIGIN) + '/api/create-checkout-session?session_id=cs_test_offline']);
    confirm({ paid: true });
    await ui.done;
    assert.equal(store.getItem(CART_KEY), '[]');
    assert.deepEqual(store.writes, [[CART_KEY, '[]']]);
  }
});

test('Success retains cart for absent session, unpaid/invalid responses and verification failures', async () => {
  const failures = [
    { search: '', fetch: () => { throw new Error('Missing session must not fetch'); } },
    ...[false, 'true', 1, null, undefined].map(paid => ({ fetch: async () => response({ paid }) })),
    { fetch: async () => response({ paid: true }, false) },
    { fetch: async () => { throw new Error('Offline network failure'); } },
    { fetch: async () => ({ ok: true, json: async () => { throw new Error('Invalid JSON'); } }) },
  ];
  for (const failure of failures) {
    const store = storage(sampleCart()), before = store.getItem(CART_KEY);
    await page('success.html', { store, search: '?session_id=cs_test_offline', ...failure }).done;
    retained(store, before);
  }
});
