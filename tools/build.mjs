#!/usr/bin/env node
// Renders the shop from data. Everything in data/catalogue-*.json becomes a
// product page, a card on the shop index, and a line in the client question
// list. Nothing on those pages is written here that is not in the data, which
// is how the copy rules stay enforceable: there is one place the words live.
//
//   node tools/build.mjs

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Latin binomials get italicised wherever they appear in running copy.
const LATIN = /\b([A-Z][a-z]+)\s(?:(?:crispus|cottonii|vesiculosus|alliacea|impetiginosa|somnifera|agnus-castus|ginseng|asiatica|membranaceus|simaruba|niruri|erinaceus|lucidum|obliquus|reptans|arabica|senegal|quinquefolius)|([a-z]{4,}))\b/g;
const italicise = (s) => esc(s).replace(
  /\b(Chondrus crispus|Eucheuma cottonii|Fucus vesiculosus|Gracilaria|Petiveria alliacea|Tabebuia impetiginosa|Handroanthus impetiginosus|Withania somnifera|Vitex agnus-castus|Panax ginseng|Panax quinquefolius|Centella asiatica|Astragalus membranaceus|Bursera simaruba|Phyllanthus niruri|Hericium erinaceus|Ganoderma lucidum|Inonotus obliquus|Ajuga reptans|Acacia senegal|Laminaria|Chlorella|Rhodophyta)\b/g,
  '<i>$1</i>',
);

const CATEGORIES = [
  ['seamoss', 'Sea moss', 'Red and brown algae, as gel and as capsules. Two species, and we say which is which.'],
  ['formulas', 'Formulas', 'Multi-herb capsule blends. Every page lists what is in the capsule.'],
  ['botanicals', 'Single botanicals', 'One plant, one species, one part of it, in a vegan capsule.'],
  ['mushrooms', 'Mushrooms', 'Fruiting bodies and blends. The questions we are still asking the maker are on each page.'],
  ['minerals', 'Minerals and stones', 'Shilajit resin from the Altai, and shungite from Karelia.'],
  ['kits', 'Kits', 'Bundles of the above, with the contents and the saving printed.'],
  ['library', 'Library', "Reiss's books."],
  ['service', 'The consultation', 'An hour with the practitioner.'],
  ['apparel', 'Apparel', 'Two shirts.'],
];

// ── shared furniture ────────────────────────────────────────────────────────
const up = (d) => '../'.repeat(d);

const head = (d, { title, description, extraCss = '', jsonLd = '' }) => `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FFEDD2">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<noscript><style>.rv{opacity:1!important;transform:none!important}</style></noscript>
<link rel="stylesheet" href="${up(d)}assets/site.css">
<link rel="stylesheet" href="${up(d)}assets/shop.css">${extraCss}
${jsonLd}</head>
<body>`;

const nav = (d) => `
<nav class="nav nav--solid" data-solid>
  <div class="nav__in">
    <button class="nav__burger" id="burger" aria-expanded="false" aria-controls="drawer" aria-label="Menu"><span></span><span></span><span></span></button>
    <div class="nav__side nav__side--l">
      <a href="${up(d)}shop.html">Shop</a><a href="${up(d)}shop.html#seamoss">Sea moss</a><a href="${up(d)}shop.html#formulas">Formulas</a>
    </div>
    <a class="nav__mark" href="${up(d)}index.html" aria-label="Herbase, home"><img src="${up(d)}assets/wordmark.png" alt="Herbase"></a>
    <div class="nav__side nav__side--r">
      <a href="${up(d)}journal/">Journal</a><a href="${up(d)}products/1-hour-consultation.html">Consultation</a><a href="#" data-bag>Bag (0)</a>
    </div>
    <a class="nav__bag" href="#">Bag (0)</a>
  </div>
  <div class="nav__drawer" id="drawer">
    <a href="${up(d)}shop.html">Shop</a><a href="${up(d)}shop.html#seamoss">Sea moss</a><a href="${up(d)}shop.html#formulas">Formulas</a><a href="${up(d)}journal/">Journal</a><a href="${up(d)}products/1-hour-consultation.html">Book the hour · £120</a>
  </div>
</nav>`;

const foot = (d) => `
<footer class="foot">
  <div class="wrap">
    <div class="foot__top"><img src="${up(d)}assets/wordmark.png" alt="Herbase"></div>
    <div class="foot__grid">
      <div>
        <h3>The shop</h3>
        <p>599 Smithdown Road<br>Liverpool L15 5AP</p>
        <p style="margin-top:10px">07946 806533<br>herbase.earth@gmail.com</p>
      </div>
      <div>
        <h3>Shop</h3>
        <a href="${up(d)}shop.html#seamoss">Sea moss</a><a href="${up(d)}shop.html#formulas">Formulas</a><a href="${up(d)}shop.html#botanicals">Single botanicals</a><a href="${up(d)}shop.html#mushrooms">Mushrooms</a><a href="${up(d)}shop.html#kits">Kits</a><a href="${up(d)}shop.html#library">Books</a>
      </div>
      <div>
        <h3>Know</h3>
        <a href="${up(d)}journal/">Journal</a><a href="${up(d)}journal/how-to-read-a-supplement-label.html">How to read a label</a><a href="${up(d)}products/1-hour-consultation.html">The consultation</a><a href="${up(d)}shop.html">Everything we sell</a>
      </div>
      <div>
        <h3>Orders</h3>
        <a href="#">Delivery</a><a href="#">Returns and cancellation</a><a href="#">Privacy</a><a href="#">Terms</a>
      </div>
    </div>
    <div class="foot__legal">
      <p class="credits">Photography made for this site. No stock library images.</p>
      <p>Food supplements should not be used as a substitute for a varied and balanced diet and a healthy lifestyle. Keep out of reach of young children. Do not exceed the stated dose.</p>
      <p>Herbase, 599 Smithdown Road, Liverpool L15 5AP. Food business registered with Liverpool City Council.</p>
    </div>
  </div>
</footer>`;

const scripts = `
<script>
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.14,rootMargin:'0px 0px -8%'});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
const burger=document.getElementById('burger'),drawer=document.getElementById('drawer');
burger.addEventListener('click',()=>{
  const open=drawer.hasAttribute('data-open');
  open?drawer.removeAttribute('data-open'):drawer.setAttribute('data-open','');
  burger.setAttribute('aria-expanded',String(!open));
});
</script>
</body>
</html>`;

// ── product page ────────────────────────────────────────────────────────────
function productPage(p, all, articles) {
  const d = 1;
  const img = `${up(d)}assets/products/${p.image}.jpg`;
  const imgM = `${up(d)}assets/products/${p.image}-m.jpg`;
  const cat = CATEGORIES.find((c) => c[0] === p.category);
  const related = all.filter((x) => x.category === p.category && x.handle !== p.handle).slice(0, 4);
  const article = articles[p.handle];
  const isSupplement = !['library', 'service', 'apparel'].includes(p.category);

  const variants = p.variants && p.variants.length > 1
    ? `<div class="plans" role="group" aria-label="Size">
        ${p.variants.map((v, i) => `<button class="plan" data-price="${esc(v.price)}" data-title="${esc(v.title)}" aria-pressed="${i === 0}">
          <span class="plan__name">${esc(v.title)}</span><span class="plan__price">£${esc(v.price)}</span>
        </button>`).join('\n        ')}
      </div>`
    : '';

  const jsonLd = `<script type="application/ld+json">
${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.name, description: p.standfirst,
    brand: { '@type': 'Brand', name: 'Herbase' },
    offers: (p.variants || [{ title: p.name, price: p.price }]).map((v) => ({
      '@type': 'Offer', name: v.title, price: v.price, priceCurrency: 'GBP',
      availability: 'https://schema.org/InStock',
    })),
  }, null, 0)}
</script>`;

  return `${head(d, {
    title: `${p.name}, ${p.subtitle} · Herbase`,
    description: p.standfirst,
    jsonLd,
  })}
${nav(d)}

<section class="pdp" id="buy">
  <div class="wrap">
    <p class="crumb"><a href="${up(d)}index.html">Home</a><span>/</span><a href="${up(d)}shop.html">Shop</a><span>/</span><a href="${up(d)}shop.html#${p.category}">${esc(cat ? cat[1] : 'Shop')}</a><span>/</span>${esc(p.name)}</p>
    <div class="pdp__grid">
      <figure class="pdp__img rv">
        <img src="${img}" srcset="${imgM} 800w, ${img} 1600w" sizes="(min-width:900px) 620px, 100vw" alt="${esc(p.imageSubject ? p.imageSubject.split('.')[0] : p.name)}" decoding="async">
      </figure>
      <div class="pdp__buy rv d1">
        <p class="label">${esc(cat ? cat[1] : '')}</p>
        <h1 class="dsp">${esc(p.name)}</h1>
        <p class="pdp__sub">${italicise(p.subtitle)}</p>
        <p class="pdp__price" id="price">£${esc(p.price)}</p>
        ${variants}
        <a class="btn buy__cta" id="buybtn" href="#spec">Add to bag</a>
        <p class="buy__note">This is a demonstration site. Nothing can be bought here yet.</p>
        <dl class="pdp__facts">
          ${(p.spec || []).slice(0, 4).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${italicise(v)}</dd></div>`).join('\n          ')}
        </dl>
      </div>
    </div>
  </div>
</section>

<section class="pdp__body">
  <div class="wrap">
    <div class="pdp__cols">
      <div class="prose rv">
        <p class="standfirst">${italicise(p.standfirst)}</p>
        ${(p.body || []).map((para) => `<p>${italicise(para)}</p>`).join('\n        ')}
      </div>
      <aside class="pdp__aside rv d1">
        ${isSupplement && p.dose ? `<div class="card"><h3>How it is taken</h3><p>${italicise(p.dose)}</p>${p.supply ? `<p class="muted">${italicise(p.supply)}</p>` : ''}</div>` : ''}
        ${article ? `<div class="card"><h3>In the journal</h3><p><a href="${up(d)}journal/${article.slug}">${esc(article.title)}</a></p><p class="muted">${esc(article.blurb)}</p></div>` : ''}
        <div class="card"><h3>Ask first</h3><p>An hour with Reiss is £120 and covers what to take, in what order, and what to leave alone.</p><p><a href="${up(d)}products/1-hour-consultation.html">Book the consultation</a></p></div>
      </aside>
    </div>
  </div>
</section>

<section class="mono spec" id="spec">
  <div class="wrap">
    <div class="head"><p class="label">Specification</p><h2>What is actually in it</h2>
      <p>Everything on this sheet comes from the pack or the maker. Where a figure is not printed anywhere, it is not here either, and it is on the <a href="${up(d)}client-questions.html">question list</a> instead.</p></div>
    <table class="tbl">
      <tbody>
        ${(p.spec || []).map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${italicise(v)}</td></tr>`).join('\n        ')}
        ${p.dose ? `<tr><th scope="row">Dose</th><td>${italicise(p.dose)}</td></tr>` : ''}
        ${p.supply ? `<tr><th scope="row">Pack lasts</th><td>${italicise(p.supply)}</td></tr>` : ''}
        <tr><th scope="row">Price</th><td>${(p.variants || [{ title: '', price: p.price }]).map((v) => `£${esc(v.price)}${v.title && p.variants.length > 1 ? ` for ${esc(v.title)}` : ''}`).join(', ')}</td></tr>
      </tbody>
    </table>
  </div>
</section>

${(p.cautions || []).length ? `<section class="cautions">
  <div class="wrap">
    <div class="head"><p class="label">Before you take it</p><h2>Who should not take this</h2>
      <p>Safety information is the one thing a shop is always allowed to tell you, so we tell you all of it.</p></div>
    <ul class="cautions__list">
      ${p.cautions.map((c) => `<li>${italicise(c)}</li>`).join('\n      ')}
    </ul>
    <p class="cautions__foot">If you take prescribed medication, are pregnant or breastfeeding, or are under the care of a doctor for anything at all, speak to them before starting a supplement. This is a food shop and not a medical service.</p>
  </div>
</section>` : ''}

${related.length ? `<section class="also">
  <div class="wrap">
    <div class="head"><p class="label">${esc(cat ? cat[1] : 'More')}</p><h2>The rest of the shelf</h2></div>
    <div class="cards">
      ${related.map((r) => card(r, d)).join('\n      ')}
    </div>
  </div>
</section>` : ''}

${foot(d)}
${scripts.replace('</script>\n</body>', `
document.querySelectorAll('.plan').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.plan').forEach(x=>x.setAttribute('aria-pressed','false'));
  b.setAttribute('aria-pressed','true');
  document.getElementById('price').textContent='£'+b.dataset.price;
}));
</script>
</body>`)}`;
}

// ── a card, used on the shop index and in the related rail ──────────────────
function card(p, d) {
  return `<a class="card2" href="${up(d)}products/${p.handle}.html">
        <span class="card2__img"><img loading="lazy" decoding="async" src="${up(d)}assets/products/${p.image}-m.jpg" alt="${esc(p.name)}"></span>
        <span class="card2__name">${esc(p.name)}</span>
        <span class="card2__sub">${esc(p.subtitle)}</span>
        <span class="card2__price">£${esc(p.price)}</span>
      </a>`;
}

// ── shop index ──────────────────────────────────────────────────────────────
function shopPage(all) {
  const d = 0;
  const groups = CATEGORIES
    .map(([key, name, blurb]) => [key, name, blurb, all.filter((p) => p.category === key)])
    .filter(([, , , items]) => items.length);

  return `${head(d, {
    title: 'Everything we sell · Herbase',
    description: 'The whole Herbase catalogue, forty-seven products, every one of them listed by species, part, count and dose rather than by what it is supposed to do.',
  })}
${nav(d)}

<header class="shophead">
  <div class="wrap">
    <p class="label rv">The shop</p>
    <h1 class="dsp rv d1">Everything we sell</h1>
    <p class="shophead__lede rv d2">Forty-seven products. Each one is listed by what it is: the species, the part of the plant, the count in the pack and the dose on the label. What any of it does for you is not something we are allowed to tell you, and it is not something we would want to guess at anyway. <a href="journal/how-to-read-a-supplement-label.html">Here is how to read a label</a>, ours included.</p>
    <nav class="shopnav rv d2" aria-label="Categories">
      ${groups.map(([key, name, , items]) => `<a href="#${key}">${esc(name)} <span>${items.length}</span></a>`).join('\n      ')}
    </nav>
  </div>
</header>

${groups.map(([key, name, blurb, items]) => `<section class="shopgroup" id="${key}">
  <div class="wrap">
    <div class="head"><p class="label">${items.length} ${items.length === 1 ? 'product' : 'products'}</p><h2>${esc(name)}</h2><p>${esc(blurb)}</p></div>
    <div class="cards">
      ${items.map((p) => card(p, d)).join('\n      ')}
    </div>
  </div>
</section>`).join('\n')}

<section class="turn strip">
  <div class="wrap">
    <div class="head"><p class="label">Why the pages read like this</p><h2>We publish the specification, you decide the rest</h2>
      <p>Every other shop in this category tells you what a plant will do to your body. Almost none of them are allowed to. We took all of that off these pages and put the species, the plant part, the count and the dose in its place, and we published the questions we are still asking the maker rather than filling the gaps in ourselves.</p>
      <p><a href="client-questions.html">The open questions</a> · <a href="journal/how-to-read-a-supplement-label.html">How to read a supplement label</a></p></div>
  </div>
</section>

${foot(d)}
${scripts}`;
}

// ── the question list ───────────────────────────────────────────────────────
function questionsPage(all) {
  const d = 0;
  const withQ = all.filter((p) => (p.queries || []).length);
  const total = withQ.reduce((n, p) => n + p.queries.length, 0);
  return `${head(d, {
    title: 'Open questions · Herbase',
    description: 'Every figure the catalogue does not print, listed by product, as questions for the maker rather than guesses on a page.',
  })}
${nav(d)}
<header class="shophead">
  <div class="wrap">
    <p class="label rv">Working document</p>
    <h1 class="dsp rv d1">The open questions</h1>
    <p class="shophead__lede rv d2">Building these pages meant reading every listing for facts rather than adjectives, and the reading turned up ${total} things the shop does not currently print anywhere. None of them have been guessed at. They are all here, by product, so they can be answered once and then appear on the pages for good. This page is a working document and would not ship on the live site.</p>
  </div>
</header>
<section>
  <div class="wrap">
    <div class="qlist">
      ${withQ.map((p) => `<div class="qlist__item">
        <h3><a href="products/${p.handle}.html">${esc(p.name)}</a></h3>
        <ul>${p.queries.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>
${foot(d)}
${scripts}`;
}

// ── run ─────────────────────────────────────────────────────────────────────
const files = (await readdir(join(ROOT, 'data')))
  .filter((f) => f.startsWith('catalogue-') && f.endsWith('.json'));

let all = [];
for (const f of files) {
  const list = JSON.parse(await readFile(join(ROOT, 'data', f), 'utf8'));
  all = all.concat(list);
}
// Stable order: category order first, then price descending inside it.
const catIndex = Object.fromEntries(CATEGORIES.map(([k], i) => [k, i]));
all.sort((a, b) => (catIndex[a.category] ?? 99) - (catIndex[b.category] ?? 99)
  || Number(b.price) - Number(a.price));

let articles = {};
try { articles = JSON.parse(await readFile(join(ROOT, 'data/article-links.json'), 'utf8')); } catch {}

await mkdir(join(ROOT, 'products'), { recursive: true });
for (const p of all) {
  await writeFile(join(ROOT, 'products', `${p.handle}.html`), productPage(p, all, articles));
}
await writeFile(join(ROOT, 'shop.html'), shopPage(all));
await writeFile(join(ROOT, 'client-questions.html'), questionsPage(all));

const queries = all.reduce((n, p) => n + (p.queries || []).length, 0);
console.log(`${all.length} products from ${files.length} catalogue files`);
console.log(`  ${all.length} product pages, shop.html, client-questions.html`);
console.log(`  ${queries} open questions for the client`);
for (const [k, name] of CATEGORIES) {
  const n = all.filter((p) => p.category === k).length;
  if (n) console.log(`  ${String(n).padStart(3)}  ${name}`);
}
