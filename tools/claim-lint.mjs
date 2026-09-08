#!/usr/bin/env node
// Reads every page on the site and every catalogue entry, and fails if any of
// them makes a health claim. The rules it enforces are written out in
// docs/COPY-RULES.md; this file is that document made executable, because a
// rule nobody checks is a rule that quietly stops being true.
//
//   node tools/claim-lint.mjs            lint the whole site
//   node tools/claim-lint.mjs <paths>    lint specific files
//   node tools/claim-lint.mjs --json     machine readable output
//
// Exit code is 1 if anything at critical or high severity survives.
//
// A line may be exempted with a trailing  <!--lint-ok: reason-->  in HTML, or by
// adding its exact text to data/lint-allow.json. Exemptions are for passages
// that discuss claims in order to refuse them, which is a section every article
// on this site is required to carry.

import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, dirname, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const asJson = process.argv.includes('--json');
const argPaths = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// Body parts, systems and functions. A benefit verb pointed at one of these is
// a health claim regardless of how it is hedged.
const BODY = String.raw`(?:immun\w*|thyroid|hormon\w*|blood sugar|blood pressure|glucose|insulin|circulat\w*|cardiovascular|heart|liver|kidney|pancrea(?:s|tic)|prostate|gut|digest\w*|bowel|colon|brain|nerve|nervous|cogniti\w*|memory|focus|mood|anxiety|stress|sleep|energy|metabolis\w*|cellular|cell(?:s)?|dna|genome|skin|hair|nail|joint|bone|muscle|lung|respirat\w*|breathing|oxygen|libido|fertility|sperm|testosterone|oestrogen|estrogen|menopaus\w*|period|cycle|weight|appetite|inflammation|immunity|adrenal|lymph\w*|detoxification)`;

const BENEFIT = String.raw`(?:support\w*|help\w*|aid\w*|promot\w*|boost\w*|enhanc\w*|improv\w*|restor\w*|regulat\w*|balanc\w*|cleans\w*|detoxif\w*|purif\w*|flush\w*|repair\w*|rebuild\w*|protect\w*|defend\w*|fight\w*|combat\w*|kill\w*|reduc\w*|reliev\w*|eas\w*|sooth\w*|calm\w*|strengthen\w*|nourish\w*|revitalis\w*|rejuvenat\w*|optimis\w*|heal\w*|treat\w*|cur\w*|prevent\w*|stimulat\w*|activat\w*|maintain\w*|increas\w*|lower\w*|regenerat\w*)`;

const RULES = [
  // Criminal and medicinal territory. Nothing on this site may go near these.
  { id: 'cancer', severity: 'critical', re: /\bcancer(?!\s+act)|carcinogen|tumour|tumor|oncolog/i,
    note: 'Section 4 Cancer Act 1939. Criminal offence to advertise a cancer treatment.' },
  { id: 'disease', severity: 'critical',
    re: /\b(diabet\w*|candida|herpes|arthrit\w*|\bibs\b|hypothyroid\w*|hyperthyroid\w*|infection|virus|viral|bacterial|parasit(?:e|es|ic|osis)|worms|fibroid|endometriosis|psoriasis|eczema|acne|asthma|dementia|alzheimer|depression|insomnia|osteoporosis|anaemia|anemia|hypertension|cholesterol|covid|sars)\b/i,
    note: 'Naming a disease presents the product as a medicine. Human Medicines Regulations 2012.' },
  { id: 'medicinal-verb', severity: 'critical',
    re: /\b(cures?|cured|curing|treats?|treated|treating|heals?|healed|healing|prevents?|prevented|preventing|remed(?:y|ies))\b/i,
    unless: /\btreat(?:s|ed|ing)?\s+(?:\w+\s+){0,2}as\b/i,
    note: 'Medicinal presentation. Not available to a food supplement in any form.' },

  // Ordinary unauthorised health claims.
  { id: 'benefit-on-body', severity: 'high',
    re: new RegExp(String.raw`\b${BENEFIT}\s+(?:\w+\s+){0,3}?${BODY}\b`, 'i'),
    // A caution may describe the reader's own prescribed medicine. That is a
    // statement about a drug they already take, not a claim about our food.
    unless: /\b(?:medication|medicine|drugs?|treatment|tablets?|prescription)\s+(?:to|that|which)\s+\w+/i,
    note: 'Benefit verb pointed at a body part, system or function.' },
  { id: 'body-benefit-noun', severity: 'high',
    re: new RegExp(String.raw`\b${BODY}\s+(?:support|health|function|balance|defence|defense)\b`, 'i'),
    note: 'A body system named as the benefit on offer.' },
  { id: 'pharmacology', severity: 'high',
    re: /\banti[- ]?(viral|bacterial|fungal|microbial|parasitic|inflammator\w*|oxidant\w*)\b/i,
    note: 'Pharmacological action claim. Not permitted for a food.' },
  { id: 'bioavailability', severity: 'high',
    re: /\b(bioavailab\w*|absorption|uptake)\s+(?:blend|formula|complex|enhanc\w*|boost\w*)/i,
    note: 'An absorption claim is a health claim.' },
  { id: 'detox-as-effect', severity: 'high',
    re: /\b(detox(?:es|ing|ify|ifies|ification)?|cleanse[sd]?|cleansing|purif\w*|flush(?:es|ing)?)\s+(?:the\s+)?(?:body|system|blood|liver|gut|colon|cells?)\b/i,
    note: 'Detox as a promised effect. The word survives only inside a product name.' },

  // Hedges. These do not rescue a claim, they only evidence that it was known.
  { id: 'hedge', severity: 'medium',
    re: /\b(may (?:help|support|aid|assist|reduce|improve|boost)|is (?:traditionally|historically) used (?:to|for) (?:treat|help|support|relieve|cure)|has been used (?:to|for) (?:treat|cure|relieve)|customers (?:say|tell us|report) (?:it|this) (?:help|work|cure))/i,
    note: 'A hedged claim is the same claim. It is not a defence.' },
  { id: 'mysticism', severity: 'medium',
    re: /\b(cellular (?:battery|conductivity|frequency)|food becomes frequency|electromagnetic (?:charge|energy) of|raise your vibration|monatomic)/i,
    note: 'Unfalsifiable mechanism copy. Reads evasive and argues nothing.' },

  // House rules that are not law but are not negotiable either.
  { id: 'em-dash', severity: 'high', re: /—/,
    note: 'Em dash. This client does not use them anywhere. Use a comma, a colon or a full stop.' },
  { id: 'hype', severity: 'low',
    re: /\b(powerful|potent|revered|ancient wisdom|sacred|miracle|game[- ]chang\w*|unlock your|harness the|superfood|wellness journey|holistic approach)\b/i,
    note: 'Hype adjective. The voice argues on specification, not on adjectives.' },
];

// Proper names of real products and books. The lint must not fire on a name.
const PROPER_NAMES = [
  'Detox Redox', '28 Day Detox Kit', 'Parasite Cleanse', 'Cell Repair Kit',
  'Menopause Kit', 'Mens Health Kit', "Men's Health Kit", 'Athletes Kit',
  'Prostrate', 'Respire', 'Pancrea', 'Decolonise', 'Mag Flux', 'Test Drive',
  'Feminina', 'Nutropic', 'Equill', 'Mycrodose', 'Neptune', 'Northern Soul',
  'Seaking', 'Nu Heru', 'Purple Mwani', 'Galaxeye', 'Khepra', 'The Ripple Effect',
];

// The live shop's own copy and our internal reference documents quote the
// banned language on purpose. They are working material, never published pages.
const SKIP_FILES = new Set([
  'tools/claim-lint.mjs',
  'data/products-source.md',
  'data/products-live.json',
  'data/queries.md',
]);
const SKIP_DIRS = ['node_modules', '.git', 'variants', 'directions', 'assets', 'data/images', 'docs'];

// Safety information is not a health claim and there is no ceiling on it. A
// caution has to be able to name the condition it is cautioning about, so the
// disease and medicinal-verb rules stand down inside a clearly framed warning.
const CAUTION_FRAME = /\b(do not (?:take|use)|not for|not suitable|avoid|speak to|talk to|consult|ask your|check with|if you (?:are|have|take|suffer)|before (?:taking|use)|discontinue|seek|under medical|prescribed|diagnos(?:ed|is)|pregnan\w*|breastfeeding|GP\b|doctor|pharmacist|practitioner)/i;
const CAUTION_EXEMPT = new Set(['disease', 'medicinal-verb', 'cancer']);

// Every article on this site is required to carry a passage explaining what the
// law does not let us say, and every page carries the statutory line disclaiming
// any claim at all. Those sentences necessarily contain the words the rules ban.
// A line that is visibly talking ABOUT claims, or refusing one, is not making one.
const META_FRAME = /\b(makes? no claim|no claim (?:is|that)|not (?:a|make a|making a) (?:health )?claim|presented as (?:treating|preventing)|as though it (?:treats|cures|prevents)|is a medicine|would be a medicine|am not (?:allowed|permitted)|are not (?:allowed|permitted|authorised)|not (?:permitted|authorised|on the register)|cannot (?:say|claim|tell you)|may not (?:say|claim|be)|is illegal to|would fail|the claims? (?:are|is)|these claims|such claims|no authorised claim|treat(?:ed|s)? as (?:a |the )?(?:synonym|same|equivalent)|hedged|is the same claim|not recognised in|aren't standard|is not standard|without naming a single|not a category)/i;
const META_EXEMPT = new Set(['disease', 'medicinal-verb', 'benefit-on-body', 'body-benefit-noun', 'pharmacology', 'hedge', 'detox-as-effect']);

// The one authorised claim this site is entitled to make, quoted exactly as the
// GB register words it. It is permitted only where the microgram figure is
// printed beside it, which is Seaking and nowhere else.
const AUTHORISED = /iodine contributes to normal thyroid function and to normal energy[- ]yielding metabolism/i;

async function loadAllowlist() {
  try {
    return new Set(JSON.parse(await readFile(join(ROOT, 'data/lint-allow.json'), 'utf8')).map((s) => s.trim()));
  } catch { return new Set(); }
}

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    const rel = relative(ROOT, p);
    if (SKIP_DIRS.some((d) => rel === d || rel.startsWith(`${d}/`))) continue;
    if (e.isDirectory()) await walk(p, out);
    else if (['.html', '.json', '.md'].includes(extname(e.name)) && !SKIP_FILES.has(rel)) out.push(p);
  }
  return out;
}

// Strip the things a claim cannot hide inside: tags, urls, and product names.
function scrub(line) {
  let s = line
    .replace(/<!--.*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\b[\w.-]+\.(?:html|jpg|png|json|css|mjs)\b/g, ' ');
  for (const n of PROPER_NAMES) s = s.split(n).join(' ');
  return s;
}

const allow = await loadAllowlist();
const files = argPaths.length
  ? argPaths.map((p) => resolve(ROOT, p))
  : await walk(ROOT);

const COPY_FIELDS = new Set(['name', 'subtitle', 'standfirst', 'body', 'spec', 'dose', 'supply', 'cautions', 'form', 'latin']);

// Pull only the strings a customer will read out of one catalogue entry.
function copyStrings(entry) {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  for (const [k, v] of Object.entries(entry)) if (COPY_FIELDS.has(k)) walk(v);
  return out;
}

const findings = [];
for (const file of files) {
  let text;
  try { text = await readFile(file, 'utf8'); } catch { continue; }
  const rel = relative(ROOT, file);

  // Catalogue data: check the copy fields, ignore sourceTitle and queries,
  // which exist precisely to hold the language we removed.
  if (/^data\/catalogue-.*\.json$/.test(rel)) {
    let entries;
    try { entries = JSON.parse(text); } catch (e) {
      findings.push({ file: rel, line: 1, rule: 'invalid-json', severity: 'critical',
        match: e.message, note: 'The build cannot read this file.', context: '' });
      continue;
    }
    for (const entry of entries) {
      for (const raw of copyStrings(entry)) {
        const line = scrub(raw);
        if (!line.trim()) continue;
        const isCaution = CAUTION_FRAME.test(line);
        const isMeta = META_FRAME.test(line);
        const isAuthorised = AUTHORISED.test(line);
        for (const rule of RULES) {
          if (isCaution && CAUTION_EXEMPT.has(rule.id)) continue;
          if (isMeta && META_EXEMPT.has(rule.id)) continue;
          if (isAuthorised && rule.id !== 'em-dash') continue;
          if (rule.unless && rule.unless.test(line)) continue;
          const m = rule.re.exec(rule.id === 'em-dash' ? raw : line);
          if (!m) continue;
          findings.push({ file: rel, line: entry.handle, rule: rule.id, severity: rule.severity,
            match: m[0].trim(), note: rule.note, context: raw.slice(0, 130) });
        }
      }
    }
    continue;
  }

  text.split('\n').forEach((raw, i) => {
    if (/<!--\s*lint-ok/.test(raw)) return;
    if (allow.has(raw.trim())) return;
    const line = scrub(raw);
    if (!line.trim()) return;
    const isCaution = CAUTION_FRAME.test(line);
    const isMeta = META_FRAME.test(line);
    const isAuthorised = AUTHORISED.test(line);
    for (const rule of RULES) {
      if (isCaution && CAUTION_EXEMPT.has(rule.id)) continue;
      if (isMeta && META_EXEMPT.has(rule.id)) continue;
      if (isAuthorised && rule.id !== 'em-dash') continue;
      if (rule.unless && rule.unless.test(line)) continue;
      const m = rule.re.exec(rule.id === 'em-dash' ? raw : line);
      if (!m) continue;
      const at = Math.max(0, m.index - 45);
      findings.push({
        file: rel, line: i + 1, rule: rule.id, severity: rule.severity,
        match: m[0].trim(), note: rule.note,
        context: (rule.id === 'em-dash' ? raw : line).slice(at, m.index + m[0].length + 45).trim(),
      });
    }
  });
}

const order = { critical: 0, high: 1, medium: 2, low: 3 };
findings.sort((a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);

if (asJson) {
  console.log(JSON.stringify(findings, null, 2));
} else {
  const counts = findings.reduce((a, f) => ({ ...a, [f.severity]: (a[f.severity] || 0) + 1 }), {});
  for (const f of findings) {
    console.log(`${f.severity.toUpperCase().padEnd(8)} ${f.file}:${f.line}  [${f.rule}]  "${f.match}"`);
    console.log(`         ...${f.context}...`);
  }
  console.log(`\n${files.length} files checked. ` +
    (findings.length
      ? `${findings.length} findings: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}.`
      : 'Clean.'));
}

process.exitCode = findings.some((f) => f.severity === 'critical' || f.severity === 'high') ? 1 : 0;
