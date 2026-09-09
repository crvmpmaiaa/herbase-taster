#!/usr/bin/env node
/* tools/render.mjs  ·  content JSON -> static HTML, no dependencies.
 *
 *   node tools/render.mjs --all
 *   node tools/render.mjs content/products/seaking.json
 *   node tools/render.mjs content/articles/seaking-iodine.json
 *   node tools/render.mjs --shop
 *
 * Flags: --out DIR (render somewhere else, used by the golden test)
 *        --force   (overwrite an existing file whose bytes differ)
 *        --eol=lf|crlf  (default lf, which is what every round-1 page uses)
 *        --quiet
 *
 * Every class used here already exists in assets/site.css. The renderer never
 * writes to assets/site.css. Page-specific CSS goes in the page's inline style.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..');

/* ── plumbing ─────────────────────────────────────────────────────────── */

export const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));
export const exists = rel => fs.existsSync(path.join(ROOT, rel));

let _reg = null;
export function registry() {
  if (!_reg) _reg = readJSON(path.join(ROOT, 'content', 'registry.json'));
  return _reg;
}

/** A bare name means assets/journal/<name>.jpg with an -m.jpg twin; a path is used as given. */
export function img(name) {
  if (!name) return null;
  const full = String(name).includes('/') ? String(name) : `assets/journal/${name}.jpg`;
  const m = full.replace(/\.(jpg|jpeg|png|webp)$/i, '-m.$1');
  return { full, m: exists(m) ? m : full, hasM: exists(m) };
}

const GEN = /(^|\/)gen-|capsule-scoop|oil-drop|mask-bowl/;
export const isGenerated = name => GEN.test(String(name || ''));

/** Repo-root-relative link, corrected for page depth (journal pages sit one down). */
export function href(h, depth) {
  if (!h) return h;
  if (!depth) return h;
  if (/^(https?:|mailto:|tel:|#|\.\.?\/)/.test(h)) return h;
  if (h === 'journal/' || h === 'journal') return './';
  if (h.startsWith('journal/')) return h.slice(8);
  return '../' + h;
}

/* Inline HTML is allowed in string values only for <i> <b> <em> <a href="">. */
const TAG = /<\/?(?:i|b|em)>|<a href="[^"<>]*">|<\/a>/g;
const escText = s => String(s)
  .replace(/&(?![a-zA-Z#][a-zA-Z0-9]{0,8};)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Escape a copy string, keeping the four allowed tags and fixing link depth. */
export function esc(s, depth = 0, linkStyle = '') {
  if (s == null) return '';
  const str = String(s);
  let out = '', last = 0, m;
  TAG.lastIndex = 0;
  while ((m = TAG.exec(str))) {
    out += escText(str.slice(last, m.index));
    let tag = m[0];
    const a = tag.match(/^<a href="([^"<>]*)">$/);
    if (a) tag = `<a href="${attr(href(a[1], depth))}"${linkStyle ? ` style="${linkStyle}"` : ''}>`;
    out += tag;
    last = m.index + m[0].length;
  }
  return out + escText(str.slice(last));
}

/** Attribute value: no tags, quotes escaped. */
export function attr(s) {
  if (s == null) return '';
  return escText(String(s).replace(/<[^>]*>/g, '')).replace(/"/g, '&quot;');
}

const plain = s => String(s == null ? '' : s).replace(/<[^>]*>/g, ' ');
const words = s => (plain(s).match(/\S+/g) || []).length;
const firstSeg = s => String(s || '').split(' · ')[0];
const DELAY = i => (i % 4 === 0 ? '' : ` d${i % 4}`);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
export function longDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(iso || '');
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/* ── shared furniture ─────────────────────────────────────────────────── */

const HEAD_TOP = t => [
  '<!DOCTYPE html>',
  '<html lang="en-GB">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<meta name="theme-color" content="#FFEDD2">',
  `<title>${esc(t.title)}</title>`,
  `<meta name="description" content="${attr(t.description)}">`,
];

const STICKY_CSS = '.stickybuy{padding-bottom:max(10px,env(safe-area-inset-bottom))}';
const NONE_CSS = [
  '.ing__none{aspect-ratio:1;background:var(--night);display:grid;place-items:center;padding:18px;text-align:center}',
  '.ing__none p{padding:0;font-family:var(--display);font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,237,210,.8);line-height:1.5}',
  '.ing__none span{display:block;margin-top:8px;font-family:var(--body);font-size:10px;letter-spacing:0;text-transform:none;color:rgba(255,237,210,.5)}',
].join('\n');
const HELD_CSS = [
  '.gal [hidden]{display:none}',
  '.gal__main .card__img--held{aspect-ratio:auto;height:100%;border-bottom:0;padding:24px}',
  '.gal__thumbs .thumb--held{background:var(--night);display:grid;place-items:center;padding:6px}',
  '.gal__thumbs .thumb--held span{font-family:var(--display);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,237,210,.72);line-height:1.4}',
].join('\n');

function nav(depth) {
  const p = depth ? '../' : '';
  const j = depth ? './' : 'journal/';
  const cur = depth ? ' aria-current="page"' : '';
  return [
    '<nav class="nav nav--solid" data-solid>',
    '  <div class="nav__in">',
    '    <button class="nav__burger" id="burger" aria-expanded="false" aria-controls="drawer" aria-label="Menu"><span></span><span></span><span></span></button>',
    '    <div class="nav__side nav__side--l">',
    `      <a href="${p}shop.html">Formulas</a><a href="${p}product.html">Sea Moss</a><a href="${p}index.html#best">Mushrooms</a>`,
    '    </div>',
    `    <a class="nav__mark" href="${p}index.html" aria-label="Herbase, home"><img src="${p}assets/wordmark.png" alt="Herbase"></a>`,
    '    <div class="nav__side nav__side--r">',
    `      <a href="${j}"${cur}>Journal</a><a href="${p}product-consultation.html">Consultation</a><a href="#" data-bag>Bag (0)</a>`,
    '    </div>',
    '    <a class="nav__bag" href="#">Bag (0)</a>',
    '  </div>',
    '  <div class="nav__drawer" id="drawer">',
    `    <a href="${p}shop.html">Formulas</a><a href="${p}product.html">Sea Moss</a><a href="${p}index.html#best">Mushrooms</a><a href="${j}">Journal</a><a href="${p}index.html#shop">Book the hour · £120</a>`,
    '  </div>',
    '</nav>',
  ].join('\n');
}

const LEGAL_PRODUCT = 'Food supplements should not be used as a substitute for a varied and balanced diet and a healthy lifestyle. Keep out of reach of young children.';
const LEGAL_ARTICLE = 'This article is general information about a food, written by the person who sells it. It is not medical advice and it makes no claim that any product will treat, cure or prevent any condition. Food supplements should not be used as a substitute for a varied and balanced diet and a healthy lifestyle. Keep out of reach of young children.';

/** credits[] plus the automatic generated-scene line when a generated image is used.
 *  The prefix names only what the page actually carries: pages with at least one
 *  credited Commons image keep the existing sentence (byte-identical for the golden
 *  seaking page); a page with no Commons or Unsplash image at all gets a prefix that
 *  says so instead of naming sources it does not use. */
export function creditsLine(list, usedImages) {
  const parts = (list || []).filter(Boolean);
  let s = parts.length ? 'Photography via Unsplash and Wikimedia Commons.' : 'Photographs of the shop by Herbase.';
  if (parts.length) s += ' ' + parts.join(' · ');
  if ((usedImages || []).some(isGenerated)) {
    s += (parts.length ? ' · ' : ' ') + 'Some scenes generated (Nano Banana Pro), not photographs of Herbase stock.';
  }
  return s;
}

function foot(depth, credits, legal) {
  const p = depth ? '../' : '';
  const j = depth ? './' : 'journal/';
  return [
    '<footer class="foot">',
    '  <div class="wrap">',
    `    <div class="foot__top"><img src="${p}assets/wordmark.png" alt="Herbase"></div>`,
    '    <div class="foot__grid">',
    '      <div>',
    '        <h3>The shop</h3>',
    '        <p>599 Smithdown Road<br>Liverpool L15 5AP</p>',
    '        <p style="margin-top:10px">07946 806533<br>herbase.earth@gmail.com</p>',
    '      </div>',
    '      <div>',
    '        <h3>Shop</h3>',
    `        <a href="${p}index.html#monograph">Signature formulas</a><a href="${p}product.html">Sea moss</a><a href="${p}index.html#best">Mushrooms</a><a href="${p}shop.html#kits">Bundle kits</a><a href="${p}shop.html#objects">Books</a>`,
    '      </div>',
    '      <div>',
    '        <h3>Know</h3>',
    `        <a href="${href('journal/who-should-not.html', depth)}">Safety and contraindications</a><a href="${href('journal/how-we-source.html', depth)}">How we source</a><a href="${p}product-consultation.html">The consultation</a><a href="${j}">Journal</a>`,
    '      </div>',
    '      <div>',
    '        <h3>Orders</h3>',
    '        <a href="#">Delivery</a><a href="#">Returns and cancellation</a><a href="#">Privacy</a><a href="#">Terms</a>',
    '      </div>',
    '    </div>',
    '    <div class="foot__legal">',
    `      <p class="credits">${esc(credits)}</p>`,
    `      <p>${esc(legal)}</p>`,
    '      <p>Herbase, 599 Smithdown Road, Liverpool L15 5AP. Food business registered with Liverpool City Council.</p>',
    '    </div>',
    '  </div>',
    '</footer>',
  ].join('\n');
}

const SCRIPT_TOP = [
  "const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.14,rootMargin:'0px 0px -8%'});",
  "document.querySelectorAll('.rv').forEach(el=>io.observe(el));",
].join('\n');

const SCRIPT_BURGER = [
  "const burger=document.getElementById('burger'),drawer=document.getElementById('drawer');",
  "burger.addEventListener('click',()=>{",
  "  const open=drawer.hasAttribute('data-open');",
  "  open?drawer.removeAttribute('data-open'):drawer.setAttribute('data-open','');",
  "  burger.setAttribute('aria-expanded',String(!open));",
  '});',
].join('\n');

const SCRIPT_GAL = [
  "/* index 0 is a real photo, so the main frame starts on it; a held entry can still",
  "   appear later in the gallery, so its placeholder is made lazily and swapped in,",
  "   mirroring what SCRIPT_GAL_HELD does the other way round for a held index 0 */",
  "const frame=document.querySelector('.gal__main'),main=document.getElementById('galmain'),cap=document.getElementById('galcap');",
  'let held=null;',
  "document.querySelectorAll('.gal__thumbs button').forEach(b=>b.addEventListener('click',()=>{",
  "  document.querySelectorAll('.gal__thumbs button').forEach(x=>x.setAttribute('aria-pressed','false'));",
  "  b.setAttribute('aria-pressed','true');",
  '  cap.textContent=b.dataset.cap;',
  '  if(!b.dataset.src){',
  "    if(!held){held=document.createElement('div'); held.className='card__img card__img--held'; held.innerHTML='<p>Pack photography held<span>Label reprint pending</span></p>'; frame.appendChild(held)}",
  '    main.hidden=true; held.hidden=false; return;',
  '  }',
  '  if(held) held.hidden=true; main.hidden=false;',
  '  main.removeAttribute(\'srcset\'); main.src=b.dataset.src; main.alt=b.querySelector(\'img\').alt;',
  '}));',
].join('\n');

const SCRIPT_GAL_HELD = [
  '/* the pack shot is held, so the main frame starts on the placeholder and the',
  '   photo element is only made once a botanical thumbnail is chosen */',
  "const frame=document.querySelector('.gal__main'),held=document.getElementById('galheld'),cap=document.getElementById('galcap');",
  'let shot=null;',
  "document.querySelectorAll('.gal__thumbs button').forEach(b=>b.addEventListener('click',()=>{",
  "  document.querySelectorAll('.gal__thumbs button').forEach(x=>x.setAttribute('aria-pressed','false'));",
  "  b.setAttribute('aria-pressed','true');",
  '  cap.textContent=b.dataset.cap;',
  '  if(!b.dataset.src){if(shot)shot.hidden=true; held.hidden=false; return}',
  "  if(!shot){shot=document.createElement('img'); shot.decoding='async'; frame.appendChild(shot)}",
  "  shot.src=b.dataset.src; shot.alt=b.querySelector('img').alt; shot.hidden=false; held.hidden=true;",
  '}));',
].join('\n');

const SCRIPT_STICKY_PRODUCT = [
  "const sticky=document.getElementById('sticky'),cta=document.getElementById('buybtn');",
  "new IntersectionObserver(e=>{e[0].isIntersecting||e[0].boundingClientRect.top>0?sticky.removeAttribute('data-show'):sticky.setAttribute('data-show','')},{threshold:0}).observe(cta);",
].join('\n');

const SCRIPT_STICKY_ARTICLE = [
  "const sticky=document.getElementById('sticky'),buy=document.getElementById('buy');",
  'let ticking=false;',
  "addEventListener('scroll',()=>{",
  '  if(ticking) return; ticking=true;',
  '  requestAnimationFrame(()=>{',
  '    const pastIntro=scrollY>900, atBuy=!buy||buy.getBoundingClientRect().top<innerHeight;',
  "    pastIntro&&!atBuy?sticky.setAttribute('data-show',''):sticky.removeAttribute('data-show');",
  '    ticking=false;',
  '  });',
  '},{passive:true});',
].join('\n');

/* ── product cards (also / buyrow / shop) ─────────────────────────────── */

/** A card entry is a registry handle, or an object of overrides around one. */
function cardData(entry, depth) {
  const reg = registry();
  const o = typeof entry === 'string' ? { handle: entry } : { ...entry };
  const r = reg[o.handle] || {};
  const price = o.price || r.price || '';
  const page = o.href || r.page || '#';
  const image = img(o.img || r.img || 'assets/hero-root.jpg');
  return {
    name: o.name || r.name || o.handle,
    price,
    href: href(page, depth),
    src: href(image.m, depth),
    alt: o.alt || o.name || r.name || o.handle,
    sub: o.lead || o.sub || r.sub || '',
    btn: o.btn || (/^from /i.test(price) ? 'Choose a size' : 'Add to bag'),
    imgName: o.img || r.img || '',
  };
}

function cardHTML(c, depth, i, indent) {
  const pad = ' '.repeat(indent);
  const sub = c.sub ? `<p class="prod__sub">${esc(c.sub, depth)}</p>` : '';
  return [
    `${pad}<article class="prod rv${DELAY(i)}"><a class="prod__img" href="${attr(c.href)}"><img loading="lazy" decoding="async" src="${attr(c.src)}" alt="${attr(c.alt)}"></a>`,
    `${pad}  <div class="prod__row"><h3>${esc(c.name)}</h3><span>${esc(c.price)}</span></div>${sub}<a class="prod__buy" href="${attr(c.href)}">${esc(c.btn)}</a></article>`,
  ].join('\n');
}

/* ── product page ─────────────────────────────────────────────────────── */

export function renderProduct(d) {
  const depth = 0;
  const kind = d.kind || 'supplement';
  const used = [];
  const use = n => { if (n) used.push(n); return img(n); };
  const S = [];

  const gallery = d.gallery || [];
  const heldFirst = !!(gallery[0] && gallery[0].held);
  const css = [STICKY_CSS];
  if (gallery.some(g => g.held)) css.push(HELD_CSS);
  if ((d.ingredients?.cards || []).some(c => !c.img)) css.push(NONE_CSS);
  if (d.css) css.push(String(d.css).trim());

  const head = HEAD_TOP(d).concat([
    '<noscript><style>.rv{opacity:1!important;transform:none!important}</style></noscript>',
    '<link rel="stylesheet" href="assets/site.css">',
    '<style>',
    css.join('\n'),
    '</style>',
    '</head>',
    '<body>',
  ]).join('\n');
  S.push(head, nav(depth));

  /* buy panel ---------------------------------------------------------- */
  const crumb = d.crumb || [];
  const rating = String(d.rating || '');
  const rHead = rating.split(' · ')[0];
  const rRest = rating.slice(rHead.length);
  const unit = d.unit || '';
  const ctanote = d.ctanote || [firstSeg(unit), d.price].filter(Boolean).join(' · ');

  const buy = [];
  buy.push('      <div class="buy">');
  if (rating) buy.push(`        <p class="buy__rating"><span class="stars">★★★★★</span><span><b>${esc(rHead)}</b>${esc(rRest)}</span></p>`);
  if (d.label) buy.push(`        <p class="label">${esc(d.label)}</p>`);
  buy.push(`        <h1 class="dsp">${esc(d.name)}</h1>`);
  buy.push(`        <p class="buy__price"><b id="price">${esc(d.price)}</b><span id="unit">${esc(unit)}</span></p>`);
  buy.push('        <ul class="buy__pts">');
  for (const pt of d.points || []) buy.push(`          <li>${esc(pt, depth)}</li>`);
  buy.push('        </ul>');
  buy.push('        <a class="buy__spec" href="#spec">Full specification sheet</a>');
  if ((d.perks || []).length) {
    buy.push('');
    buy.push('        <ul class="buy__perks">');
    for (const pk of d.perks) buy.push(`          <li>${esc(pk, depth)}</li>`);
    buy.push('        </ul>');
  }
  buy.push(`        <a class="buy__cta" href="#buy" id="buybtn"><span>${esc(d.cta || 'Add to bag')}</span><span id="ctaprice">${esc(ctanote)}</span></a>`);
  if (d.note) buy.push(`        <p class="buy__note">${esc(d.note, depth)}</p>`);
  if ((d.acc || []).length) {
    buy.push('');
    buy.push('        <div class="acc">');
    d.acc.forEach((a, i) => {
      buy.push(`          <details${i === 0 ? ' open' : ''}>`);
      buy.push(`            <summary>${esc(a.summary)}</summary>`);
      buy.push('            <div class="acc__body">');
      for (const p of a.body || []) buy.push(`              <p>${esc(p, depth)}</p>`);
      buy.push('            </div>');
      buy.push('          </details>');
    });
    buy.push('        </div>');
  }
  buy.push('      </div>');

  const gal = [];
  gal.push('      <div class="gal">');
  if (heldFirst) {
    gal.push('        <div class="gal__main">');
    gal.push('          <div class="card__img card__img--held" id="galheld"><p>Pack photography held<span>Label reprint pending</span></p></div>');
    gal.push('        </div>');
  } else {
    const f = use(gallery[0] && gallery[0].img);
    gal.push(`        <div class="gal__main"><img id="galmain" src="${attr(f ? f.full : '')}" alt="${attr(gallery[0] && gallery[0].alt)}" decoding="async"></div>`);
  }
  gal.push('        <div class="gal__thumbs">');
  gallery.forEach((g, i) => {
    const pressed = i === 0 ? 'true' : 'false';
    const cap = g.cap || (g.held ? 'Pack photography is held until the label is reprinted. The pictures here are of the botanicals, not of the jar.' : '');
    if (g.held) {
      gal.push(`          <button class="thumb--held" type="button" aria-pressed="${pressed}" data-cap="${attr(cap)}"><span>Pack held</span></button>`);
    } else {
      const im = use(g.img);
      gal.push(`          <button type="button" aria-pressed="${pressed}" data-src="${attr(im.full)}" data-cap="${attr(cap)}"><img src="${attr(im.m)}" alt="${attr(g.thumbAlt || g.alt)}" loading="lazy" decoding="async"></button>`);
    }
  });
  gal.push('        </div>');
  gal.push(`        <p class="gal__cap" id="galcap">${esc(gallery[0] && gallery[0].cap)}</p>`);
  gal.push('      </div>');

  S.push([
    '<section class="pdp2" id="buy">',
    '  <div class="wrap">',
    `    <p class="crumb"><a href="index.html">Home</a><span>/</span><a href="${attr(crumb[1] || 'index.html#best')}">${esc(crumb[0] || 'Shop')}</a><span>/</span>${esc(d.name)}</p>`,
    '',
    '    <div class="pdp2__grid">',
    gal.join('\n'),
    '',
    buy.join('\n'),
    '    </div>',
    '  </div>',
    '</section>',
  ].join('\n'));

  /* steps -------------------------------------------------------------- */
  if (d.steps && kind === 'supplement') {
    const st = ['<section class="steps">', '  <div class="wrap">', '    <div class="head">'];
    st.push(`      <p class="label rv">${esc(d.steps.label || 'The routine')}</p>`);
    st.push(`      <h2 class="dsp rv d1" style="margin-top:12px">${esc(d.steps.h2)}</h2>`);
    st.push('    </div>');
    st.push('    <div class="steps__grid">');
    (d.steps.items || []).forEach((s, i) => {
      const im = use(s.img);
      st.push(`      <div class="step rv${DELAY(i)}"><img src="${attr(im.m)}" alt="${attr(s.alt)}" loading="lazy" decoding="async"><h3>${esc(s.h)}</h3><p><b>${esc(s.b, depth)}</b> ${esc(s.p, depth)}</p></div>`);
    });
    st.push('    </div>', '  </div>', '</section>');
    S.push(st.join('\n'));
  }

  /* ingredients (supplement) or contents (kit) -------------------------- */
  if (d.ingredients && kind !== 'kit') {
    const g2 = d.ingredients;
    const ing = ['<section class="ingr">', '  <div class="wrap">', '    <div class="head">'];
    ing.push(`      <p class="label rv">${esc(g2.label || 'What is on the inside')}</p>`);
    ing.push(`      <h2 class="dsp rv d1" style="margin-top:12px">${esc(g2.h2)}</h2>`);
    if (g2.intro) ing.push(`      <p class="rv d2">${esc(g2.intro, depth)}</p>`);
    ing.push('    </div>');
    ing.push('    <div class="ingr__grid">');
    (g2.cards || []).forEach((c, i) => {
      const im = use(c.img);
      /* no photograph of that plant on disk: the same frame product-decolonise.html uses */
      const frame = im
        ? `<img src="${attr(im.m)}" alt="${attr(c.alt)}" loading="lazy" decoding="async">`
        : `<div class="ing__none"><p>No photograph<span>${esc(c.none || 'of the plant we buy')}</span></p></div>`;
      ing.push(`      <article class="ing rv${DELAY(i)}">${frame}<p class="ing__fam">${esc(c.fam)}</p><h3>${esc(c.latin)}<i>${esc(c.common)}</i></h3><p>${esc(c.p, depth)}</p></article>`);
    });
    ing.push('    </div>', '  </div>', '</section>');
    S.push(ing.join('\n'));
  } else if (d.contents) {
    const c = d.contents;
    const box = ['<section class="ingr">', '  <div class="wrap">', '    <div class="head">'];
    box.push(`      <p class="label rv">${esc(c.label || 'What is in the box')}</p>`);
    box.push(`      <h2 class="dsp rv d1" style="margin-top:12px">${esc(c.h2)}</h2>`);
    if (c.intro) box.push(`      <p class="rv d2">${esc(c.intro, depth)}</p>`);
    box.push('    </div>');
    box.push('    <div class="best__grid">');
    (c.items || []).forEach((it, i) => {
      const card = cardData({ ...it, sub: it.qty || it.sub, btn: it.btn || 'See the specification' }, depth);
      if (card.imgName) used.push(card.imgName);
      box.push(cardHTML(card, depth, i, 6));
    });
    box.push('    </div>', '  </div>', '</section>');
    S.push(box.join('\n'));
  }

  /* specification ------------------------------------------------------ */
  if (d.spec) {
    const sp = ['<section class="mono spec" id="spec">', '  <div class="wrap">', '    <div class="head">'];
    sp.push(`      <p class="label rv">${esc(d.spec.label || crumb[0] || 'Specification')}</p>`);
    sp.push(`      <h2 class="dsp rv d1" style="margin-top:12px">${esc(d.spec.h2 || 'The specification sheet')}</h2>`);
    if (d.spec.intro) sp.push(`      <p class="rv d2">${esc(d.spec.intro, depth)}</p>`);
    sp.push('    </div>');
    sp.push('    <div class="rv d1">');
    sp.push('      <table class="tbl">');
    sp.push(`        <caption>${esc(d.spec.caption || d.name)}</caption>`);
    sp.push('        <tbody>');
    for (const [k, v] of d.spec.rows || []) {
      sp.push(`          <tr><th scope="row">${esc(k)}</th><td>${esc(v, depth)}</td></tr>`);
    }
    sp.push('        </tbody>');
    sp.push('      </table>');
    if (d.spec.smallprint) sp.push(`      <p class="statutory">${esc(d.spec.smallprint, depth)}</p>`);
    sp.push('    </div>');
    if (d.spec.doctrine) {
      sp.push('    <div class="doctrine rv" data-doctrine>');
      sp.push(`      <h3 class="dsp">${esc(d.spec.doctrine.h3)}</h3>`);
      sp.push(`      <p>${esc(d.spec.doctrine.p, depth)}</p>`);
      sp.push('    </div>');
    }
    sp.push('  </div>', '</section>');
    S.push(sp.join('\n'));
  }

  /* Reiss's turn ------------------------------------------------------- */
  if (d.reiss) {
    const r = ['<section class="reiss turn">', '  <div class="wrap">'];
    r.push(`    <p class="label rv">${esc(d.reiss.label || 'From Reiss')}</p>`);
    r.push(`    <h2 class="dsp rv d1">${esc(d.reiss.h2)}</h2>`);
    r.push('    <div class="reiss__body">');
    for (const p of d.reiss.paras || []) r.push(`      <p class="rv d1">${esc(p, depth)}</p>`);
    if (d.reiss.pull) r.push(`      <div class="reiss__pull rv"><q>${esc(d.reiss.pull, depth)}</q></div>`);
    r.push('      <div class="reiss__sign rv">');
    for (const s of d.reiss.sign || ['Reiss Davies Ausar', '599 Smithdown Road, Liverpool']) r.push(`        <p>${esc(s)}</p>`);
    r.push('      </div>');
    r.push('    </div>', '  </div>', '</section>');
    S.push(r.join('\n'));
  }

  /* comparison --------------------------------------------------------- */
  if (d.cmp && kind === 'supplement') {
    const head3 = d.cmp.head || ['On the label', d.name, 'Typical listing'];
    const c = ['<section class="cmp">', '  <div class="wrap">', '    <div class="head">'];
    c.push(`      <h2 class="dsp rv">${esc(d.cmp.h2)}</h2>`);
    if (d.cmp.intro) c.push(`      <p class="rv d1">${esc(d.cmp.intro, depth)}</p>`);
    c.push('    </div>');
    c.push('    <table class="cmp__tbl rv d1">');
    c.push(`      <thead><tr>${head3.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>`);
    c.push('      <tbody>');
    for (const row of d.cmp.rows || []) {
      c.push(`        <tr><th scope="row">${esc(row[0], depth)}</th><td class="yes">${esc(row[1], depth)}</td><td class="no">${esc(row[2], depth)}</td></tr>`);
    }
    c.push('      </tbody>');
    c.push('    </table>');
    if (d.cmp.note) c.push(`    <p class="cmp__foot rv">${esc(d.cmp.note, depth)}</p>`);
    c.push('  </div>', '</section>');
    S.push(c.join('\n'));
  }

  /* also --------------------------------------------------------------- */
  if (d.also) {
    const a = ['<section class="also" id="also">', '  <div class="wrap">', '    <div class="head">'];
    a.push(`      <h2 class="dsp rv">${esc(d.also.h2)}</h2>`);
    if (d.also.intro) a.push(`      <p class="rv d1">${esc(d.also.intro, depth, 'color:var(--sun-ink)')}</p>`);
    a.push('    </div>');
    a.push('    <div class="best__grid">');
    (d.also.handles || []).forEach((h, i) => {
      const card = cardData(h, depth);
      if (card.imgName) used.push(card.imgName);
      a.push(cardHTML(card, depth, i, 6));
    });
    a.push('    </div>', '  </div>', '</section>');
    S.push(a.join('\n'));
  }

  /* journal teaser ----------------------------------------------------- */
  if (d.jnext) {
    S.push([
      '<section class="jnext">',
      '  <div class="wrap">',
      `    <p class="label rv" style="color:rgba(255,237,210,.55)">${esc(d.jnext.label || 'From the journal')}</p>`,
      `    <h2 class="dsp rv d1">${esc(d.jnext.h2)}</h2>`,
      `    <p class="rv d2">${esc(d.jnext.p, depth)}</p>`,
      `    <a class="btn rv d2" href="${attr(href(d.jnext.article || d.jnext.href, depth))}">${esc(d.jnext.btn || 'Read the article')}</a>`,
      '  </div>',
      '</section>',
    ].join('\n'));
  }

  S.push(foot(depth, creditsLine(d.credits, used), LEGAL_PRODUCT));

  const stickyUnit = d.stickyunit || (unit ? ' · ' + firstSeg(unit) : '');
  S.push([
    '<div class="stickybuy" id="sticky">',
    `  <span><b>${esc(d.name)}</b> · <span id="stickyprice">${esc(d.price)}</span>${stickyUnit ? `<i id="stickyunit">${esc(stickyUnit)}</i>` : ''}</span>`,
    `  <a class="btn" href="#buy">${esc(d.cta || 'Add to bag')}</a>`,
    '</div>',
  ].join('\n'));

  S.push(['<script>', SCRIPT_TOP, '', SCRIPT_BURGER, '',
    SCRIPT_STICKY_PRODUCT, '', heldFirst ? SCRIPT_GAL_HELD : SCRIPT_GAL,
    '</script>', '</body>', '</html>'].join('\n'));

  return S.join('\n\n') + '\n';
}

/* ── article page ─────────────────────────────────────────────────────── */

const FIG_SIZES = '(min-width:1100px) 1040px, 92vw';
const LEAD_SIZES = '(min-width:1100px) 1040px, 100vw';
const DUO_SIZES = '(min-width:760px) 33vw, 92vw';

function figure(f, depth, cls, sizes, use) {
  const im = use(f.img);
  const src = href(im.full, depth), m = href(im.m, depth);
  const cap = `${esc(f.cap, depth)}${f.sub ? `<i>${esc(f.sub, depth)}</i>` : ''}`;
  return `<figure${cls ? ` class="${cls}"` : ''}><img src="${attr(src)}" srcset="${attr(m)} 800w, ${attr(src)} 1600w" sizes="${sizes}" loading="lazy" decoding="async" alt="${attr(f.alt)}"><figcaption>${cap}</figcaption></figure>`;
}

/** Body copy only: headings, paragraphs, lists, tables, asides, pulls. */
function blockWords(blocks) {
  let n = 0;
  for (const b of blocks || []) {
    if (b.p) n += words(b.p);
    else if (b.h3) n += words(b.h3);
    else if (b.pull) n += words(b.pull);
    else if (b.aside) n += words(b.aside);
    else if (b.ul) n += b.ul.reduce((a, x) => a + words(x), 0);
    else if (b.table) {
      const t = b.table;
      if (t.caption) n += words(t.caption);
      if (t.head) n += t.head.reduce((a, x) => a + words(x), 0);
      for (const r of t.rows || []) n += r.reduce((a, x) => a + words(x), 0);
    }
  }
  return n;
}

export function readTime(d) {
  let n = blockWords(d.intro);
  for (const s of d.sections || []) { n += words(s.title); n += blockWords(s.blocks); }
  n += blockWords(d.outro);
  return Math.max(1, Math.round(n / 213));
}

function renderBlocks(blocks, depth, use, out, pad) {
  for (const b of blocks || []) {
    if (b.p != null) out.push(`${pad}<p${b.style ? ` style="${attr(b.style)}"` : ''}>${esc(b.p, depth)}</p>`);
    else if (b.h3 != null) out.push(`${pad}<h3>${esc(b.h3, depth)}</h3>`);
    else if (b.pull != null) out.push(`${pad}<div class="pull"><q>${esc(b.pull, depth)}</q></div>`);
    else if (b.aside != null) out.push(`${pad}<div class="aside">${esc(b.aside, depth)}</div>`);
    else if (b.ul) {
      out.push(`${pad}<ul>`);
      for (const li of b.ul) out.push(`${pad}  <li>${esc(li, depth)}</li>`);
      out.push(`${pad}</ul>`);
    } else if (b.fig) {
      out.push(pad + figure(b.fig, depth, `fig--${b.fig.kind || 'tall'}`, FIG_SIZES, use));
    } else if (b.duo) {
      out.push(`${pad}<div class="duo">${b.duo.map(f => figure(f, depth, '', DUO_SIZES, use)).join('')}</div>`);
    } else if (b.table) {
      const t = b.table;
      out.push(`${pad}<table class="tbl">`);
      if (t.caption) out.push(`${pad}  <caption>${esc(t.caption)}</caption>`);
      if (t.head) out.push(`${pad}  <thead><tr>${t.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>`);
      out.push(`${pad}  <tbody>`);
      for (const r of t.rows || []) {
        out.push(`${pad}    <tr><th scope="row">${esc(r[0], depth)}</th>${r.slice(1).map(c => `<td>${esc(c, depth)}</td>`).join('')}</tr>`);
      }
      out.push(`${pad}  </tbody>`);
      out.push(`${pad}</table>`);
    }
    out.push('');
  }
}

export function renderArticle(d) {
  const depth = 1;
  const used = [];
  const use = n => { if (n) used.push(n); return img(n); };
  const S = [];
  const lead = d.lead ? img(d.lead.img) : null;
  if (d.lead) used.push(d.lead.img);
  const headline = d.ogtitle || String(d.title || '').replace(/ · Herbase Journal$/, '');

  const css = [STICKY_CSS];
  if (d.css) css.push(String(d.css).trim());

  /* headline, description, date and the lead image, per the renderer brief. The
     hand-written exemplar carries no description or image key; both are added
     here because Article rich results want them. */
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description: d.description,
    author: { '@type': 'Person', name: 'Reiss Davies Ausar' },
    publisher: { '@type': 'Organization', name: 'Herbase', address: '599 Smithdown Road, Liverpool L15 5AP' },
    datePublished: d.date,
    inLanguage: 'en-GB',
  };
  if (lead) ld.image = href(lead.full, depth);

  S.push(HEAD_TOP(d).concat([
    `<meta property="og:title" content="${attr(headline)}">`,
    `<meta property="og:description" content="${attr(d.ogdesc || d.description)}">`,
    ...(lead ? [`<meta property="og:image" content="${attr(href(lead.full, depth))}">`] : []),
    '<meta property="article:author" content="Reiss Davies Ausar">',
    `<meta property="article:published_time" content="${attr(d.date)}">`,
    '<noscript><style>.rv{opacity:1!important;transform:none!important}</style></noscript>',
    '<link rel="stylesheet" href="../assets/site.css">',
    '<style>',
    css.join('\n'),
    '</style>',
    '<script type="application/ld+json">',
    JSON.stringify(ld),
    '</script>',
    '</head>',
    '<body>',
  ]).join('\n'));
  S.push(nav(depth));

  const crumbTail = d.crumbTail || String(d.label || '').split(' · ').pop() || d.h1;
  const body = [];
  body.push('<article class="article">');
  body.push('  <div class="wrap">');
  body.push(`    <p class="crumb" style="text-align:center"><a href="../index.html">Home</a><span>/</span><a href="${attr(href((d.crumb && d.crumb[1]) || 'journal/', depth))}">${esc((d.crumb && d.crumb[0]) || 'Journal')}</a><span>/</span>${esc(crumbTail)}</p>`);
  body.push('    <header class="article__head" style="margin-top:14px">');
  body.push(`      <p class="label rv">${esc(d.label)}</p>`);
  body.push(`      <h1 class="dsp rv d1">${esc(d.h1)}</h1>`);
  body.push(`      <p class="standfirst rv d2">${esc(d.standfirst, depth)}</p>`);
  body.push(`      <p class="article__by rv d2"><span>By <b>Reiss Davies Ausar</b></span><span>${esc(longDate(d.date))}</span><span>${readTime(d)} minute read</span></p>`);
  body.push('    </header>');
  body.push('');
  if (d.lead) {
    const src = href(lead.full, depth), m = href(lead.m, depth);
    body.push('    <figure class="article__lead rv">');
    body.push(`      <img src="${attr(src)}" srcset="${attr(m)} 800w, ${attr(src)} 1600w" sizes="${LEAD_SIZES}" alt="${attr(d.lead.alt)}" decoding="async">`);
    body.push(`      <figcaption>${esc(d.lead.cap, depth)}${d.lead.sub ? `<i>${esc(d.lead.sub, depth)}</i>` : ''}</figcaption>`);
    body.push('    </figure>');
    body.push('');
  }
  body.push('    <div class="prose">');

  const prose = [];
  renderBlocks(d.intro, depth, use, prose, '      ');
  (d.sections || []).forEach((s, i) => {
    prose.push(`      <h2 id="${attr(s.id)}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(s.title, depth)}</h2>`);
    prose.push('');
    renderBlocks(s.blocks, depth, use, prose, '      ');
  });

  if (d.buyrow) {
    const b = d.buyrow;
    if (b.h2) { prose.push(`      <h2 id="buy">${esc(b.h2, depth)}</h2>`); prose.push(''); }
    if (b.intro) { prose.push(`      <p>${esc(b.intro, depth)}</p>`); prose.push(''); }
    prose.push('      <div class="buyrow">');
    (b.cards || []).forEach((c, i) => {
      const card = cardData(c, depth);
      if (card.imgName) used.push(card.imgName);
      prose.push(cardHTML(card, depth, i, 8));
    });
    prose.push('      </div>');
    prose.push('');
  }
  renderBlocks(d.outro, depth, use, prose, '      ');

  prose.push('      <div class="author">');
  prose.push('        <img src="../assets/apothecary-m.jpg" alt="Reiss Davies Ausar behind the counter at Herbase">');
  prose.push('        <div>');
  prose.push('          <h3>Reiss Davies Ausar</h3>');
  prose.push(`          <p>${esc(d.author, depth)}</p>`);
  prose.push('        </div>');
  prose.push('      </div>');

  body.push(prose.join('\n'));
  body.push('    </div>');
  body.push('  </div>');
  body.push('</article>');
  S.push(body.join('\n'));

  if (d.jnext) {
    S.push([
      '<section class="jnext">',
      '  <div class="wrap">',
      `    <p class="label rv" style="color:rgba(255,237,210,.55)">${esc(d.jnext.label)}</p>`,
      `    <h2 class="dsp rv d1">${esc(d.jnext.h2)}</h2>`,
      `    <p class="rv d2">${esc(d.jnext.p, depth)}</p>`,
      `    <a class="btn rv d2" href="${attr(href(d.jnext.href || d.jnext.article, depth))}">${esc(d.jnext.btn || 'Read the article')}</a>`,
      '  </div>',
      '</section>',
    ].join('\n'));
  }

  S.push(foot(depth, creditsLine(d.credits, used), LEGAL_ARTICLE));

  const first = (d.buyrow && d.buyrow.cards && d.buyrow.cards[0]) || null;
  const st = d.sticky || (first ? { handle: typeof first === 'string' ? first : first.handle } : null);
  if (st) {
    const c = cardData(st.handle ? { handle: st.handle, href: st.href, name: st.name, price: st.price } : st, depth);
    S.push([
      '<div class="stickybuy" id="sticky">',
      `  <span><b>${esc(c.name)}</b> · ${esc(c.price)}${st.note ? `<i>${esc(st.note)}</i>` : ''}</span>`,
      `  <a class="btn" href="${attr(c.href)}">${esc(st.btn || 'Shop it')}</a>`,
      '</div>',
    ].join('\n'));
  }

  S.push(['<script>', SCRIPT_TOP,
    "window.addEventListener('load',()=>document.querySelectorAll('.article__head .rv, .article__lead').forEach(el=>el.classList.add('in')));",
    SCRIPT_BURGER, SCRIPT_STICKY_ARTICLE, '</script>', '</body>', '</html>'].join('\n'));

  return S.join('\n\n') + '\n';
}

/* ── shop page ────────────────────────────────────────────────────────── */

const SHOP_GROUPS = [
  ['botanicals', 'Single ingredients', 'One plant, resin or oil, named as far as the label names it.', ['botanical', 'mineral', 'oil']],
  ['formulas', 'Formulas', 'Blends of botanicals. Each sheet prints the list the listing gives, and says so where it gives none.', ['formula']],
  ['mushrooms', 'Mushrooms', 'Named species, with the part printed where the listing prints it.', ['mushroom']],
  ['seamoss', 'Sea moss', 'Gels and capsules, by species and preparation.', ['seamoss']],
  ['kits', 'Kits', 'Several jars boxed together, priced as a box.', ['kit']],
  ['objects', 'Books, apparel and objects', 'Everything on the shelf that is not a supplement.', ['object', 'apparel', 'book', 'service']],
];

export function renderShop() {
  const reg = registry();
  const depth = 0;
  const subs = {};
  const dir = path.join(ROOT, 'content', 'products');
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
      try {
        const p = readJSON(path.join(dir, f));
        if (p.slug) subs[p.slug] = p.unit || p.spec?.rows?.find(r => /serving|contents/i.test(r[0]))?.[1] || '';
      } catch { /* a half-written file is not fatal to the shop page */ }
    }
  }

  const S = [];
  S.push(HEAD_TOP({
    title: 'The shelf · Every Herbase product · Herbase',
    description: 'Every product Herbase sells, grouped by what it is: single ingredients, formulas, mushrooms, sea moss, kits and objects. Prices as listed, specification sheets where they are written.',
  }).concat([
    '<noscript><style>.rv{opacity:1!important;transform:none!important}</style></noscript>',
    '<link rel="stylesheet" href="assets/site.css">',
    '<style>',
    '.stickybuy{padding-bottom:max(10px,env(safe-area-inset-bottom))}',
    '/* the only rule this page adds: the anchor row under the heading */',
    '.shopnav{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 10px;margin:0 auto clamp(30px,3.5vw,48px);max-width:60ch}',
    '.shopnav a{font-family:var(--display);font-size:12px;letter-spacing:.13em;text-transform:uppercase;text-decoration:none;color:var(--ink);border:1px solid var(--rule);padding:9px 13px;transition:background-color .25s var(--ease),color .25s var(--ease)}',
    '.shopnav a:hover,.shopnav a:focus-visible{background:var(--ink);color:var(--paper)}',
    '</style>',
    '</head>',
    '<body>',
  ]).join('\n'));
  S.push(nav(depth));

  const top = ['<section class="best">', '  <div class="wrap">', '    <div class="head">'];
  top.push('      <p class="label rv">The shelf</p>');
  const total = Object.keys(reg).length;
  top.push('      <h2 class="dsp rv d1" style="margin-top:12px">Everything, <em>grouped as it sits</em></h2>');
  top.push(`      <p class="rv d2">${total} products, every one with a specification sheet. Prices as listed.</p>`);
  top.push('    </div>');
  top.push('    <p class="shopnav rv d2">' + SHOP_GROUPS.map(g => `<a href="#${g[0]}">${esc(g[1])}</a>`).join('') + '</p>');
  top.push('  </div>', '</section>');
  S.push(top.join('\n'));

  for (const [id, title, sub, cats] of SHOP_GROUPS) {
    const keys = Object.keys(reg).filter(k => cats.includes(reg[k].category));
    if (!keys.length) continue;
    const sec = [`<section class="best" id="${id}">`, '  <div class="wrap">', '    <div class="head">'];
    sec.push(`      <h2 class="dsp rv">${esc(title)}</h2>`);
    sec.push(`      <p class="rv d1">${esc(sub)}</p>`);
    sec.push('    </div>');
    sec.push('    <div class="best__grid">');
    keys.forEach((k, i) => {
      const r = reg[k];
      const card = cardData({ handle: k, sub: r.sub || subs[k] || '', alt: r.name }, depth);
      sec.push(cardHTML(card, depth, i, 6));
    });
    sec.push('    </div>', '  </div>', '</section>');
    S.push(sec.join('\n'));
  }

  S.push(foot(depth, creditsLine([], []), LEGAL_PRODUCT));
  S.push(['<script>', SCRIPT_TOP, '', SCRIPT_BURGER, '</script>', '</body>', '</html>'].join('\n'));
  return S.join('\n\n') + '\n';
}

/* ── cli ──────────────────────────────────────────────────────────────── */

export function outputPath(file, d) {
  if (String(file).includes(`content${path.sep}articles`) || String(file).includes('content/articles')) {
    return path.join('journal', `${d.slug}.html`);
  }
  return `product-${d.slug}.html`;
}

/* The six pages that were written by hand, plus the six hand-written articles.
   The renderer will not overwrite one of these with different bytes unless it is
   asked to with --force, so a golden round trip can never damage the originals. */
const HAND_BUILT_ARTICLES = [
  'journal/which-sea-moss.html', 'journal/seaking-iodine.html', 'journal/lions-mane.html',
  'journal/shilajit.html', 'journal/decolonise-stop-date.html', 'journal/chondrus-crispus-gel.html',
];
function handBuilt() {
  const pages = Object.values(registry()).filter(r => r.built).map(r => r.page);
  return new Set([...pages, ...HAND_BUILT_ARTICLES]);
}

function write(rel, html, opts) {
  const eol = opts.eol === 'crlf' ? html.replace(/\n/g, '\r\n') : html;
  const dest = path.join(opts.out || ROOT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const prev = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null;
  const key = rel.replace(/\\/g, '/');
  if (prev === eol) return `unchanged  ${key}`;
  if (prev !== null && !opts.out && !opts.force && handBuilt().has(key)) {
    return `SKIPPED    ${key} (hand built and the render differs; --force to overwrite)`;
  }
  fs.writeFileSync(dest, eol);
  return `${prev === null ? 'wrote      ' : 'rewrote    '}${key}`;
}

function listContent() {
  const out = [];
  for (const kind of ['products', 'articles']) {
    const dir = path.join(ROOT, 'content', kind);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
      out.push(path.join('content', kind, f));
    }
  }
  return out;
}

export function renderFile(rel) {
  const d = readJSON(path.join(ROOT, rel));
  const isArticle = rel.replace(/\\/g, '/').includes('content/articles');
  return { rel: outputPath(rel, d), html: isArticle ? renderArticle(d) : renderProduct(d) };
}

function main(argv) {
  const opts = { eol: 'lf', force: false, out: null, quiet: false };
  const files = [];
  let shop = false, all = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') all = true;
    else if (a === '--shop') shop = true;
    else if (a === '--force') opts.force = true;
    else if (a === '--quiet') opts.quiet = true;
    else if (a.startsWith('--eol=')) opts.eol = a.slice(6);
    else if (a === '--out') opts.out = path.resolve(argv[++i]);
    else if (a.startsWith('--out=')) opts.out = path.resolve(a.slice(6));
    else if (a.startsWith('-')) { console.error(`unknown flag ${a}`); process.exit(2); }
    else files.push(a.replace(/\\/g, '/'));
  }
  if (all) files.push(...listContent());
  if (!files.length && !shop) {
    console.error('usage: node tools/render.mjs [--all | --shop | content/products/x.json] [--out DIR] [--force] [--eol=lf|crlf]');
    process.exit(2);
  }

  const log = [];
  let bad = 0;
  for (const f of files) {
    try {
      const { rel, html } = renderFile(f);
      log.push(write(rel, html, opts));
    } catch (e) {
      /* one broken JSON must not stop the batch */
      bad++;
      log.push(`ERROR      ${f}: ${e.message}`);
    }
  }
  if (shop) log.push(write('shop.html', renderShop(), opts));
  if (!opts.quiet) console.log(log.join('\n'));
  /* a SKIPPED hand-built page is the guard doing its job, not a failure */
  if (bad) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2));
}
