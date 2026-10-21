'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
test('homepage and gallery retain product images but cannot add to cart', () => {
  for (const f of ['index.html','shop.html']) {
    const html=read(f);
    assert.match(html, /<img\b/i, f+' images should remain');
    assert.doesNotMatch(html, /add-to-cart|>Buy Now<|>Pay by card</i, f+' purchase controls');
    assert.doesNotMatch(html, /href=["']\/?cart\.html["']/i, f+' cart link');
    assert.doesNotMatch(html, /<strong>£\d/i, f+' advertised prices');
  }
  assert.match(read('index.html'), /Our Products/);
  assert.match(read('shop.html'), /Our Products/);
});
test('old cart URL cannot check out', () => {
  const html=read('cart.html');
  assert.match(html, /url=shop\.html/i);
  assert.doesNotMatch(html, /create-checkout-session|Pay by card|add-to-cart/i);
});
test('POST checkout is refused before Stripe session creation', async () => {
  const src=read('api/create-checkout-session.js');
  assert.match(src, /if \(req\.method === 'POST'\) return res\.status\(503\)/);
  // Stripe session creation remains in historical GET-support module, but POST returns first.
  const vm = require('node:vm');
  let constructed=0;
  class StripeStub { constructor(){ constructed++; } }
  const context={ module:{exports:{}}, exports:{}, process:{env:{}}, require:(name)=>{assert.equal(name,'stripe');return StripeStub;} };
  vm.runInNewContext(src,context);
  let status, payload;
  const req={method:'POST',headers:{origin:'https://www.innovategeneration.com'}};
  const res={setHeader(){},status(n){status=n;return this;},json(v){payload=v;return this;},end(){return this;}};
  await context.module.exports(req,res);
  assert.equal(status,503);
  assert.equal(constructed,0);
  assert.match(payload.error,/checkout is unavailable/i);
});
test('donations and original links remain unchanged', () => {
  const html=read('index.html');
  for(const amount of ['5','15','30']) assert.match(html,new RegExp('Donate £'+amount));
  assert.match(html, /buy\.stripe\.com/);
});
test('site menus do not link to cart', () => {
  for (const file of ['index.html','shop.html','about.html','portfolio.html','articles.html','contact.html','resources.html','policy.html','success.html','creative-futures/index.html']) {
    const html=read(file);
    assert.doesNotMatch(html,/href=["']\/?cart\.html["']/i,file);
    assert.doesNotMatch(html,/>Shop<\/a>/i,file);
  }
});
