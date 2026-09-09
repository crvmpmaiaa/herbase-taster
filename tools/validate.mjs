#!/usr/bin/env node
/* tools/validate.mjs  ·  the Validation section of SCHEMA.md, no dependencies.
 *
 *   node tools/validate.mjs --all
 *   node tools/validate.mjs content/products/ginseng.json
 *
 * One line per failure, `file: rule: excerpt`, exit 1 if there are any.
 * Lines beginning `warn` do not fail the run.
 *
 * The claim words are rule 1 of BRIEF.md and the banned phrases are rule 5.
 * They are copied here so the repo validates without the brief on disk.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const rel = p => path.relative(ROOT, p).replace(/\\/g, '/');

/* ── the lists ────────────────────────────────────────────────────────── */

const CLAIM = [
  /\bsupport(s|ing|ed)\b/i, /\bboost(s|ing|ed)?\b/i, /\bpromote(s|d|ing)\b/i,
  /\bdetox(es|ify|ifying|ification)?\b/i, /\bcleanse(s|d|r)?\b/i, /\bcleansing\b/i,
  /\bimmune\b/i, /\banti-/i, /\bnourish(es|ing|ed|ment)?\b/i, /\bheal(s|ing|ed)\b/i,
  /\bbalance(s|d|ing)?\b/i, /\benergy\b/i, /\bclarity\b/i, /\bregenerat/i,
  /rich in nutrients/i, /\bsuperfood(s)?\b/i, /\bmedicinal\b/i, /ancient panacea/i,
  /* rule 1 also bans general wellbeing and cosmetic effect claims by description,
     so these three are in the list by name */
  /\bvitality\b/i, /\bwellness\b/i, /\bglowing\b/i,
];

const BANNED = [
  /is(n't| not) just\b/i,
  /* "more than a" is banned as the AI tell, not as arithmetic: a following
     quantity ("more than a hundred species") is left alone */
  /more than an? (?!hundred|thousand|dozen|million|billion|few|handful|couple|\d)/i,
  /\belevate(s|d|ing)?\b/i,
  /\bunlock(s|ed|ing)?\b/i, /\bjourney\b/i, /\bdelve\b/i, /\bseamless(ly)?\b/i,
  /\bharness(es|ed|ing)?\b/i, /\bultimate(ly)?\b/i, /\bpremium\b/i,
];

/* Allow-listed by exact text: the statutory sentences, and the two variants the
   hand-built pages already use where the caution is product specific. */
const STATUTORY = [
  'Do not exceed the stated dose.',
  'Speak to your GP or pharmacist before starting any supplement, particularly if you are pregnant, breastfeeding, or take medication.',
  'Speak to your GP or pharmacist before starting any supplement, particularly if you have a thyroid condition or take medication for one.',
  'Food supplements should not be used as a substitute for a varied and balanced diet and a healthy lifestyle.',
  'Keep out of reach of young children.',
  'Contains iodine from seaweed.',
  'Do not exceed two capsules a day.',
];

/* Keys whose values are references or markup, not copy. */
const REF_KEYS = new Set(['slug', 'kind', 'img', 'href', 'article', 'page', 'handle',
  'id', 'style', 'css', 'date', 'ogimage']);

const ALLOWED_TAG = /^(?:<\/?(?:i|b|em)>|<a href="[^"<>]*">|<\/a>)$/;

/* ── plumbing ─────────────────────────────────────────────────────────── */

const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const REGISTRY = readJSON(path.join(ROOT, 'content', 'registry.json'));
const REG_NAMES = Object.values(REGISTRY).map(r => r.name).filter(Boolean)
  .sort((a, b) => b.length - a.length);

/* Names on the manifest that no file exists for yet are a warning, not a failure:
   IMAGES-2.md says writers must not wait for the sourcing agents. */
const MANIFEST = (() => {
  const guesses = [
    process.env.HERBASE_WORK && path.join(process.env.HERBASE_WORK, 'IMAGES-2.md'),
    'V:/dev/_share/herbase-work/IMAGES-2.md',
    path.join(ROOT, '..', '_share', 'herbase-work', 'IMAGES-2.md'),
  ].filter(Boolean);
  for (const g of guesses) {
    try {
      const txt = fs.readFileSync(g, 'utf8');
      return new Set([...txt.matchAll(/`([a-z0-9-]+)`/g)].map(m => m[1]));
    } catch { /* try the next location */ }
  }
  return new Set();
})();

const exists = r => fs.existsSync(path.join(ROOT, r));
const imgPath = name => (String(name).includes('/') ? String(name) : `assets/journal/${name}.jpg`);

/** Every string in the document, with a dotted path and whether it is copy. */
function walk(node, at, out) {
  if (typeof node === 'string') { out.push({ at, value: node }); return out; }
  if (Array.isArray(node)) { node.forEach((v, i) => walk(v, `${at}[${i}]`, out)); return out; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, at ? `${at}.${k}` : k, out);
  }
  return out;
}

const isRef = at => {
  const last = at.replace(/\[\d+\]$/, '').split('.').pop();
  return REF_KEYS.has(last) || /^crumb\[1\]$/.test(at) || /\.crumb\[1\]$/.test(at);
};

function stripAllowed(s) {
  let t = s;
  for (const sent of STATUTORY) t = t.split(sent).join(' ');
  for (const name of REG_NAMES) t = t.split(name).join(' ');
  return t;
}

const cut = s => {
  const one = String(s).replace(/\s+/g, ' ').trim();
  return one.length > 96 ? one.slice(0, 93) + '...' : one;
};

/* ── the rules ────────────────────────────────────────────────────────── */

function checkDoc(file, d, kind) {
  const f = [];   // failures
  const w = [];   // warnings
  const fail = (rule, excerpt) => f.push(`${file}: ${rule}: ${excerpt}`);
  const warn = (rule, excerpt) => w.push(`warn ${file}: ${rule}: ${excerpt}`);
  const strings = walk(d, '', []);

  for (const { at, value } of strings) {
    if (/[\u2014\u2013]/.test(value)) fail('em or en dash', `${at} ${cut(value)}`);

    for (const tag of value.match(/<[^>]*>/g) || []) {
      if (!ALLOWED_TAG.test(tag)) fail('tag not i, b, em or a', `${at} ${cut(tag)}`);
    }

    if (isRef(at)) continue;
    const copy = stripAllowed(value);
    for (const re of CLAIM) {
      const m = copy.match(re);
      if (m) fail('claim word', `${at} "${m[0]}" in ${cut(value)}`);
    }
    for (const re of BANNED) {
      const m = copy.match(re);
      if (m) fail('banned phrase', `${at} "${m[0]}" in ${cut(value)}`);
    }
  }

  /* images ---------------------------------------------------------- */
  const images = [];
  const addImg = (name, at) => { if (name) images.push({ name, at }); };
  for (const g of d.gallery || []) addImg(g.img, 'gallery');
  for (const s of d.steps?.items || []) addImg(s.img, 'steps');
  for (const c of d.ingredients?.cards || []) addImg(c.img, 'ingredients');
  if (d.lead) addImg(d.lead.img, 'lead');
  const blocks = [...(d.intro || []), ...(d.sections || []).flatMap(s => s.blocks || []), ...(d.outro || [])];
  for (const b of blocks) {
    if (b.fig) addImg(b.fig.img, 'fig');
    for (const x of b.duo || []) addImg(x.img, 'duo');
  }
  for (const e of [...(d.also?.handles || []), ...(d.buyrow?.cards || []), ...(d.contents?.items || [])]) {
    if (e && typeof e === 'object' && e.img) addImg(e.img, 'card');
  }
  for (const { name, at } of images) {
    const p = imgPath(name);
    if (exists(p)) {
      const m = p.replace(/\.(jpg|jpeg|png|webp)$/i, '-m.$1');
      if (!String(name).includes('/') && !exists(m)) warn('no -m twin', `${at} ${p}`);
    } else if (MANIFEST.has(String(name))) {
      warn('image on the manifest but not on disk yet', `${at} ${p}`);
    } else {
      fail('image not on disk', `${at} ${p}`);
    }
  }

  /* registry handles ------------------------------------------------- */
  const handles = [];
  for (const e of d.also?.handles || []) handles.push([typeof e === 'string' ? e : e.handle, 'also']);
  for (const e of d.buyrow?.cards || []) handles.push([typeof e === 'string' ? e : e.handle, 'buyrow']);
  for (const e of d.contents?.items || []) handles.push([e.handle, 'contents']);
  if (d.sticky?.handle) handles.push([d.sticky.handle, 'sticky']);
  for (const [h, at] of handles) {
    if (!h || !REGISTRY[h]) fail('registry handle does not exist', `${at} ${h}`);
  }

  /* shape ------------------------------------------------------------ */
  for (const k of ['slug', 'title', 'description']) {
    if (!d[k]) fail('missing field', k);
  }
  if (kind === 'product') {
    if (!d.name) fail('missing field', 'name');
    if ((d.points || []).length !== 3) fail('needs exactly 3 points', `points: ${(d.points || []).length}`);
    if ((d.also?.handles || []).length !== 4) fail('needs exactly 4 also handles', `also: ${(d.also?.handles || []).length}`);
    if ((d.kind || 'supplement') === 'supplement' && (d.steps?.items || []).length !== 4) {
      fail('needs exactly 4 steps', `steps: ${(d.steps?.items || []).length}`);
    }
    if (!d.spec?.smallprint) fail('missing field', 'spec.smallprint');
    if ((d.description || '').length > 160) warn('description over 160 characters', `${(d.description || '').length}`);
  } else {
    if (!d.lead) fail('article needs a lead figure', 'lead');
    if ((d.sections || []).length < 5) fail('article needs at least 5 sections', `sections: ${(d.sections || []).length}`);
    if (!blocks.some(b => b.table)) fail('article needs at least one table', 'table');
    if (!blocks.some(b => b.duo)) fail('article needs at least one duo', 'duo');
    if (!(d.buyrow?.cards || []).length) fail('article needs a buyrow', 'buyrow');
    if (!d.author) fail('missing field', 'author');
  }

  return { f, w };
}

/* ── cli ──────────────────────────────────────────────────────────────── */

function listAll() {
  const out = [];
  for (const kind of ['products', 'articles']) {
    const dir = path.join(ROOT, 'content', kind);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort()) out.push(path.join(dir, f));
  }
  return out;
}

const argv = process.argv.slice(2);
const files = argv.includes('--all')
  ? listAll()
  : argv.filter(a => !a.startsWith('-')).map(a => path.resolve(ROOT, a));

if (!files.length) {
  console.error('usage: node tools/validate.mjs [--all | content/products/x.json]');
  process.exit(2);
}

let fails = 0, warns = 0;
for (const file of files) {
  const name = rel(file);
  let d;
  try { d = readJSON(file); } catch (e) { console.log(`${name}: not valid JSON: ${e.message}`); fails++; continue; }
  const kind = name.includes('content/articles') ? 'article' : 'product';
  const { f, w } = checkDoc(name, d, kind);
  for (const line of f) console.log(line);
  for (const line of w) console.log(line);
  fails += f.length;
  warns += w.length;
}
console.log(`${files.length} file${files.length === 1 ? '' : 's'} checked, ${fails} failure${fails === 1 ? '' : 's'}, ${warns} warning${warns === 1 ? '' : 's'}`);
process.exit(fails ? 1 : 0);
