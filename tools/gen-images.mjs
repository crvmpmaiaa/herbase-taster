#!/usr/bin/env node
// Generates the site's photography with Nano Banana Pro through the Kling CLI,
// then writes an optimised desktop .jpg and an 800px -m.jpg next to it.
//
//   node tools/gen-images.mjs data/images/<manifest>.json [...more manifests]
//   node tools/gen-images.mjs --all          every manifest in data/images/
//   node tools/gen-images.mjs --force ...    regenerate files that already exist
//   node tools/gen-images.mjs --dry ...      print the prompts and stop
//
// A manifest is an array of { file, ratio, subject }. `file` is a path under
// assets/. `ratio` is one of the aspect ratios the model accepts. `subject` is
// the art direction for that one frame and nothing else: the house look below
// is prepended to every prompt so the whole site looks like one shoot.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');
const CONCURRENCY = 4;
const MOBILE_WIDTH = 800;
const JPEG_QUALITY = 78;

// The house look. One paragraph, applied to every frame on the site, so that a
// journal lead, a product still and a listing thumbnail all read as the same
// photographer on the same afternoon.
const LOOK = [
  'Editorial specimen photograph in the style of a natural history plate reshot on a large format camera.',
  'Dark slate, unpolished stone or aged oak bench as the ground, deep near-black background falling away at the edges.',
  'Single source of raking daylight from one side, as if from a tall window, warm amber where it lands.',
  'Cool blue-green in the shadows. Rich shadow detail, nothing crushed to pure black.',
  'Fine natural film grain, no digital sharpening halo, shallow but controlled depth of field.',
  'Quiet, precise, unstyled. Museum register rather than advertising.',
].join(' ');

// Applied to every frame. The site sells regulated food supplements, so a
// legible label or a plausible pack in a generated frame would be an invented
// product, not a photograph.
const NEVER = [
  'ABSOLUTELY NO TEXT, no lettering, no labels, no printed packaging, no logos, no watermarks.',
  'No people, no faces, no hands.',
  'No branded jars, tubs, sachets or boxes of any kind.',
  'Not a product advertisement.',
].join(' ');

const args = process.argv.slice(2);
const force = args.includes('--force');
const dry = args.includes('--dry');
const all = args.includes('--all');
const manifestArgs = args.filter((a) => !a.startsWith('--'));

const exists = (p) => access(p).then(() => true, () => false);

function promptFor(subject) {
  return `${LOOK} ${subject.trim().replace(/\s+/g, ' ')} ${NEVER}`;
}

async function generate(entry) {
  const target = join(ASSETS, entry.file);
  if (!force && (await exists(target))) return { ...entry, skipped: true };

  const prompt = promptFor(entry.subject);
  if (dry) {
    console.log(`\n${entry.file}  [${entry.ratio}]\n${prompt}`);
    return { ...entry, dry: true };
  }

  const { stdout } = await run(
    'kling',
    [
      'text_to_image',
      '--model', 'gemini-3-pro-image',
      '--aspect_ratio', entry.ratio || '16:9',
      '--img_resolution', '2k',
      '--image_count', '1',
      '--poll', '300',
      prompt,
    ],
    { maxBuffer: 32 * 1024 * 1024, timeout: 400000 },
  );

  const url = (stdout.match(/"urlWithoutWatermark":\s*"([^"]+)"/) || [])[1]
    || (stdout.match(/"url":\s*"([^"]+)"/) || [])[1];
  if (!url) throw new Error(`no image url returned for ${entry.file}`);

  await mkdir(dirname(target), { recursive: true });
  const png = `${target}.src.png`;
  await run('curl', ['-sL', '--fail', '--retry', '3', url, '-o', png], { timeout: 180000 });

  // Desktop frame, then the 800px one the srcset asks for on phones.
  await run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(JPEG_QUALITY),
    '--resampleWidth', '1600', png, '--out', target]);
  await run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(JPEG_QUALITY),
    '--resampleWidth', String(MOBILE_WIDTH), png, '--out', target.replace(/\.jpg$/, '-m.jpg')]);
  await run('rm', ['-f', png]);

  return { ...entry, ok: true };
}

async function pool(items, worker, limit) {
  const results = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        try {
          results[i] = await worker(items[i]);
          const r = results[i];
          const mark = r.skipped ? 'skip' : r.dry ? 'dry ' : 'made';
          if (!dry) console.log(`  ${mark}  ${items[i].file}`);
        } catch (err) {
          results[i] = { ...items[i], error: err.message };
          console.error(`  FAIL  ${items[i].file}: ${err.message}`);
        }
      }
    }),
  );
  return results;
}

const manifests = all
  ? (await readdir(join(ROOT, 'data/images')))
      .filter((f) => f.endsWith('.json'))
      .map((f) => join(ROOT, 'data/images', f))
  : manifestArgs.map((p) => resolve(ROOT, p));

const entries = [];
for (const m of manifests) {
  const list = JSON.parse(await readFile(m, 'utf8'));
  for (const e of list) entries.push(e);
}

console.log(`${entries.length} frames from ${manifests.length} manifest(s)`);
const results = await pool(entries, generate, CONCURRENCY);

const made = results.filter((r) => r.ok).length;
const failed = results.filter((r) => r.error);
console.log(`\n${made} generated, ${results.filter((r) => r.skipped).length} already present, ${failed.length} failed`);
if (failed.length) {
  console.log('failed:');
  for (const f of failed) console.log(`  ${f.file}`);
  await writeFile(join(ROOT, 'data/images/.failed.json'), JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
