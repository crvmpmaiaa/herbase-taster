#!/usr/bin/env node
// Rebuilds the card list on journal/index.html from the articles themselves, so
// the listing cannot drift from what is actually published. Every field is read
// out of the article: its h1, its standfirst, its byline, its lead image.
//
//   node tools/build-journal.mjs

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JOURNAL = join(ROOT, 'journal');

const grab = (re, s, i = 1) => (re.exec(s) || [])[i] || '';
const strip = (s) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const files = (await readdir(JOURNAL)).filter((f) => f.endsWith('.html') && f !== 'index.html');

const articles = [];
for (const f of files) {
  const s = await readFile(join(JOURNAL, f), 'utf8');
  const iso = grab(/property="article:published_time" content="([^"]+)"/, s)
    || grab(/"datePublished":"([^"]+)"/, s);
  const [y, m, d] = (iso || '2026-09-08').split('-').map(Number);

  // The h1 carries an <em> for the second clause; keep the markup, it is the
  // same typographic move the card uses.
  const h1 = grab(/<h1[^>]*class="dsp[^"]*"[^>]*>([\s\S]*?)<\/h1>/, s);
  const standfirst = grab(/<p class="standfirst[^"]*"[^>]*>([\s\S]*?)<\/p>/, s);
  const lead = grab(/<figure class="article__lead[^"]*">[\s\S]*?<img src="\.\.\/([^"]+)"/, s);
  const alt = grab(/<figure class="article__lead[^"]*">[\s\S]*?alt="([^"]*)"/, s);
  const mins = grab(/(\d+)\s*minute read/, s) || String(Math.max(4, Math.round(strip(s).split(/\s+/).length / 220)));

  articles.push({
    href: f, iso, sort: new Date(iso || '2026-09-08').getTime(),
    date: `${d} ${MONTHS[m - 1]} ${y}`,
    h1: h1.replace(/\s+/g, ' ').trim(),
    title: strip(h1),
    blurb: strip(standfirst),
    lead: lead || 'assets/journal/kelp-forest.jpg',
    alt: alt || strip(h1),
    mins,
  });
}

// Newest first, and the pillar piece leads because it is the one to read first.
const PILLAR = 'how-to-read-a-supplement-label.html';
articles.sort((a, b) => (a.href === PILLAR ? -1 : b.href === PILLAR ? 1 : b.sort - a.sort));

const cards = articles.map((a, i) => {
  const m = a.lead.replace(/\.jpg$/, '-m.jpg');
  const feature = i === 0;
  return `      <a class="jcard rv${i ? ` d${Math.min(i, 3)}` : ''}${feature ? ' jcard--lead' : ''}" href="${a.href}">
        <div class="jcard__img"><img src="../${a.lead}" srcset="../${m} 800w, ../${a.lead} 1600w" sizes="(min-width:760px) 55vw, 100vw" alt="${a.alt}" ${feature ? 'decoding="async"' : 'loading="lazy" decoding="async"'}></div>
        <div class="jcard__body">
          <h3>${a.title}</h3>
          <p>${a.blurb}</p>
          <p class="jcard__meta">Reiss Davies Ausar · ${a.date} · ${a.mins} min</p>
        </div>
      </a>`;
}).join('\n');

const soon = `      <div class="jcard jcard--soon rv d3">
        <div class="jstrip"><img src="../assets/journal/bladderwrack-m.jpg" alt="Bladderwrack" loading="lazy"><img src="../assets/journal/tide-pools-m.jpg" alt="Tide pools" loading="lazy"><img src="../assets/journal/herbal-plate-m.jpg" alt="Botanical plate of seaweeds" loading="lazy"></div>
        <p class="label">Being written</p>
        <h3>Next on the bench</h3>
        <ul>
          <li>How much iodine is in a spoon of sea moss</li>
          <li>Bladderwrack: the brown alga that carries the formula</li>
          <li>Gumbo limbo, the tree that peels</li>
          <li>Wormwood, and why Decolonise has a stop date</li>
          <li>Where to buy sea moss in Liverpool</li>
        </ul>
        <p style="font-size:13px;color:var(--ink-3)">Roughly one a fortnight.</p>
      </div>`;

const indexPath = join(JOURNAL, 'index.html');
let idx = await readFile(indexPath, 'utf8');
const open = idx.indexOf('<div class="jlist">');
const close = idx.indexOf('</div>\n  </div>\n</section>', open);
if (open === -1 || close === -1) throw new Error('could not find the .jlist block in journal/index.html');

idx = `${idx.slice(0, open)}<div class="jlist">\n${cards}\n${soon}\n    ${idx.slice(close)}`;
await writeFile(indexPath, idx);

// The product pages want to know which article belongs to which product.
const LINKS = {
  'anamu-capsules': 'anamu-guinea-hen-weed.html',
  'pau-darco': 'pau-darco-inner-bark.html',
  'shilajit-resin': 'shilajit-real-or-fake.html',
  'lion-s-mane': 'lions-mane-fruiting-body.html',
  'northern-soul-sea-moss': 'which-sea-moss.html',
  'chondrus-crispus-sea-moss-gel': 'which-sea-moss.html',
  'eucheuma-cottonii-sea-moss': 'which-sea-moss.html',
  'nuheruseamoss': 'which-sea-moss.html',
  'seaking-capsules-ns-formula': 'which-sea-moss.html',
};
const bySlug = Object.fromEntries(articles.map((a) => [a.href, a]));
const links = {};
for (const [handle, slug] of Object.entries(LINKS)) {
  const a = bySlug[slug];
  if (a) links[handle] = { slug, title: a.title, blurb: `${a.blurb.slice(0, 150).trim()}…` };
}
await writeFile(join(ROOT, 'data/article-links.json'), `${JSON.stringify(links, null, 2)}\n`);

console.log(`${articles.length} articles listed on journal/index.html`);
for (const a of articles) console.log(`  ${a.date}  ${a.mins} min  ${a.href}`);
console.log(`${Object.keys(links).length} product pages will link to an article`);
