# Herbase, taster site

A static demo built for **Herbase** (herbase.earth), a wildcrafted supplement
apothecary at 599 Smithdown Road, Liverpool. It sits alongside
`Herbase-Growth-Audit.pdf` and exists to show the client what a rebuild looks
like. It is not a production site and there is no shop behind it.

## Run it

```bash
node serve.mjs          # http://localhost:3100
```

No dependencies, no build step. Vanilla HTML, CSS and JS.

`shot.mjs` takes screenshots via `puppeteer-core` against a local Chrome, used
for the review loop. It looks in `~/.cache/puppeteer` and takes `CHROME=` to
override:

```bash
node shot.mjs http://localhost:3100/ out.png
SCROLL=1400 node shot.mjs <url> out.png          # scroll-steps first, so
                                                 # IntersectionObserver reveals fire
DSF=1 node shot.mjs <url> out.png mobile         # 390x844
```

## What is here

| Path | |
|---|---|
| `index.html` | **The homepage.** This is what GitHub Pages serves. |
| `product.html` | Northern Soul sea moss gel, in the spec-sheet layout from the homepage monograph |
| `journal/index.html` | The journal listing |
| `journal/which-sea-moss.html` | First article, in Reiss's voice: the two species, gel vs capsules, storage, safety, buy block |
| `assets/site.css` | Shared styles for every page. Page-specific CSS stays inline. |
| `directions/index.html` | The original three-direction comparison board |
| `variants/b-fieldnotes-r1.html` | Round 1 of the site, kept for the score comparison |
| `variants/b-fieldnotes-r3.html` | Round 3, before the brand-font rebuild |
| `variants/a-apothecary.html` | Direction A, rejected |
| `variants/c-flightdeck.html` | Direction C, rejected |

## The hero

Five generated scenes, one picked at random per visit by an inline script in
`<head>` so the choice happens before first paint. Each scene declares its own
centre-scrim weight, because the bright ones need more help behind the wordmark
than the dark ones. Adding a sixth means one more `.jpg` in `assets/` and one
line in the `scenes` array.

Generated with Nano Banana Pro (`gemini-3-pro-image`). The prompts all share one
structural rule: **detail and luminosity at the edges, a calm dark centre**, so
the wordmark and headline sit in the hole rather than fighting the image.

## Fonts, read this before deploying

`assets/fonts/soloist-expanded.woff2` is **Soloist Expanded, a commercial
typeface licensed to Herbase**, not to us. It is committed here because the
demo does not render correctly without it.

- Fine for local work and for showing the client their own brand.
- **Do not** make this repo public, and do not deploy the font to a public host
  under any account other than Herbase's own licence.
- Montserrat is open licence and carries no such restriction.

## Copy rules, do not loosen these

The copy on this build is deliberate, not cautious by accident. UK supplement
marketing is tightly regulated. Two rules were applied throughout and should be
kept if anyone edits a word:

1. **The brand states specification, the customer states effect.** No page makes
   a health claim. Every quantity, botanical, protocol and contraindication is
   published instead.
2. **Nothing is invented.** Prices, doses, botanicals, hours and reviews are all
   lifted from source, never written to sound plausible.

No client pack photography is committed, with one exception: the plain Northern
Soul jar shot from the live listing, which carries no claim. See `.gitignore`
for the rest and why.

## Open items

Tracked privately in the growth audit, not here. Ask Jack.
