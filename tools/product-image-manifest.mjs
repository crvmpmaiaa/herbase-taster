#!/usr/bin/env node
// Turns the imageSubject line on each catalogue entry into a generation
// manifest, so the product photography comes from the same data the pages do.
//
//   node tools/product-image-manifest.mjs
//   node tools/gen-images.mjs data/images/products.json

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = (await readdir(join(ROOT, 'data')))
  .filter((f) => f.startsWith('catalogue-') && f.endsWith('.json'));

const seen = new Set();
const manifest = [];
const missing = [];

for (const f of files) {
  for (const p of JSON.parse(await readFile(join(ROOT, 'data', f), 'utf8'))) {
    if (!p.image) { missing.push(`${p.handle}: no image slug`); continue; }
    if (seen.has(p.image)) continue;
    seen.add(p.image);
    if (!p.imageSubject) { missing.push(`${p.handle}: no imageSubject`); continue; }
    // Product photography is square, because that is the shape of the card and
    // the shape the page crops the hero to.
    manifest.push({ file: `products/${p.image}.jpg`, ratio: '1:1', subject: p.imageSubject });
  }
}

await writeFile(join(ROOT, 'data/images/products.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${manifest.length} product frames written to data/images/products.json`);
if (missing.length) {
  console.log(`${missing.length} without art direction:`);
  for (const m of missing) console.log(`  ${m}`);
}
