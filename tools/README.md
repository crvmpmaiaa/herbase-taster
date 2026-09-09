# tools

Two Node scripts, no dependencies. Writers write JSON in `content/`, never HTML.

## Commands

```bash
node tools/render.mjs --all                      # every content JSON -> its page
node tools/render.mjs content/products/x.json    # one product -> product-x.html
node tools/render.mjs content/articles/y.json    # one article -> journal/y.html
node tools/render.mjs --shop                     # shop.html, every registry entry
node tools/validate.mjs --all                    # or one file; exit 1 on a failure
```

Render flags: `--out DIR` (write elsewhere), `--force`, `--eol=lf|crlf`, `--quiet`.
Output is **LF**, which is what all twelve round-1 pages use; `--eol=crlf` matches
the three older templates. The renderer will not overwrite a hand-built page
(`built: true` in `content/registry.json`, plus the six hand-written articles)
when the render differs: it prints `SKIPPED` and leaves the file alone, and
`--force` overrides. Identical bytes print `unchanged`, so `--all` is re-runnable.

## Kinds, per `SCHEMA.md`

- **supplement**: the full template (gallery, points, steps, ingredient cards,
  spec, Reiss's turn, comparison table, also, jnext).
- **kit**: `contents` (registry handles plus `qty`) replaces the ingredient
  cards and renders as a card grid; no steps, no comparison table.
- **object**: books, apparel, shungite, the consultation. Gallery, points, spec,
  a short Reiss turn, also, jnext. No steps, ingredients or comparison table.

An ingredient card with no `img` renders the `.ing__none` frame, a gallery entry
`{"held": true}` the "Pack photography held" frame; both pull the few CSS rules
they need into the page's inline `<style>` automatically.

## The golden test

`content/products/seaking.json` and `content/articles/seaking-iodine.json` are
transcriptions of the two hand-built exemplar pages, and rendering them must
reproduce those pages:

```bash
node tools/render.mjs --all --out "$TEMP/herbase-golden"
diff product-seaking.html "$TEMP/herbase-golden/product-seaking.html"
diff journal/seaking-iodine.html "$TEMP/herbase-golden/journal/seaking-iodine.html"
```

The product diff is empty. The article diff is one line: the renderer's JSON-LD
carries `description` and `image` keys the page does not. Anything else is a bug.

## Validator notes

Claim words are BRIEF.md rule 1, banned phrases rule 5, both copied into
`validate.mjs`. Statutory sentences and registry product names (Detox Redox,
Parasite Cleanse Kit and the rest) are allow-listed by exact text before the
scan; `more than a` is flagged only when no quantity follows; reference fields
(`slug`, `handle`, `href`, `img`, `page`, `id`, `style`, `css`, `date`) are not
scanned for copy rules. Lines beginning `warn` do not fail the run: an image
named on `IMAGES-2.md` but not yet on disk, a missing `-m` twin, a meta
description over 160 characters.
