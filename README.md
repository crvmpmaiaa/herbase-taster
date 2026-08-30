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
for the review loop:

```bash
node shot.mjs http://localhost:3100/ out.png
SCROLL=1400 node shot.mjs <url> out.png          # scroll-steps first, so
                                                 # IntersectionObserver reveals fire
DSF=1 node shot.mjs <url> out.png mobile         # 390x844
```

## What is here

| Path | |
|---|---|
| `index.html` | **The site.** This is what GitHub Pages serves. |
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

## The compliance posture

The copy on this build is deliberate, not cautious by accident. UK supplement
marketing is tightly regulated and the audit found live breaches on the client's
current site. Two rules were applied throughout and should be kept:

1. **The brand states specification, the customer states effect.** No page makes
   a health claim. Every quantity, botanical, protocol and contraindication is
   published instead.
2. **Nothing is invented.** Prices, doses, botanicals, hours and reviews are all
   lifted from herbase.earth, the Google Business Profile or the FSA record.

If you change copy, that is the line to hold. See section 06 and 07 of the audit
PDF for what is actually at stake.

## Known open items

- The four-month protocol is on the website but the pack says "2 caps daily".
  The pack and the site contradict each other and the client has to resolve it.
- Cascara sagrada is the first ingredient printed on the Decolonise pouch and
  appears nowhere in the site's ingredient list.
- All product links are `#`. There is no cart, no checkout, no CMS.
- The FSA hygiene rating for the shop is 1 out of 5 (Feb 2026).
