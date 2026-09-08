# Handover, 8 September 2026

Written for whoever picks this up next, human or agent. Read this file, then
`docs/COPY-RULES.md`, then `docs/VOICE.md`. Those two are the contract and they
are not style preferences, they are what keeps this shop legal.

## What this branch is

`feature/catalogue-and-journal`. It turns the taster site into the whole shop:
all 47 products as pages built from data, five new long-form journal articles,
and every stock photograph on the site replaced with imagery we generated.

## The one idea behind all of it

**The brand states specification. The customer states effect.**

Herbase's live shop describes what its products do to a body. Almost none of
that is legal in the UK: only GB register claims are usable, they attach to a
named nutrient rather than to a plant, and every botanical claim is on hold.
Some of the live copy is worse than unauthorised. `PANCREA - DIABETES SUPPORT`
presents a food as a medicine, which engages the Human Medicines Regulations.

So every page here was rebuilt out of specification instead: species, plant
part, origin, form, count, dose, and how long a pack lasts. Where a figure is
not printed anywhere, it is not on the page either. It is a question for the
client instead. That is the whole method, and it converts better than the claims
did, because a checkable fact reads honest and an unfalsifiable one reads
evasive.

## How the build works

Nothing about the shop is hand-written HTML. Four small tools do it all.

```bash
node tools/build.mjs            # 47 product pages, shop.html, client-questions.html
node tools/build-journal.mjs    # rebuilds the journal listing from the articles
node tools/claim-lint.mjs       # the compliance check. must exit 0
node tools/gen-images.mjs --all # generates any image a manifest asks for
node serve.mjs                  # http://localhost:3100
```

Run `build.mjs` and `build-journal.mjs` after any content change, and
`claim-lint.mjs` before any commit.

### The data is the source of truth

`data/catalogue-*.json`, five files, 47 entries, one per product. The schema is
in `docs/PRODUCT-SCHEMA.md`. To change what a product page says, change the
data, never the generated HTML in `products/`, which is overwritten on every
build.

Three fields are load-bearing and easy to misread:

- **`sourceTitle`** holds the live shop's title verbatim, claims and all, so the
  diff between their page and ours stays auditable. It is never rendered.
- **`queries`** is what we need the client to answer. 148 of them so far. They
  render on `client-questions.html`, which is a working document, not a page
  that would ship.
- **`spec`** is the page. Eight to fourteen rows, every one sourced. A row you
  cannot source becomes a query, never a guess.

### The linter is the safety net, use it

`tools/claim-lint.mjs` is `docs/COPY-RULES.md` made executable. It reads every
page and every catalogue entry and fails on health claims, disease names,
pharmacology claims, hedged claims, mysticism, and em dashes. It exits 1 on
anything critical or high.

It understands three kinds of legitimate exception, so do not fight it:

- **Cautions.** Safety copy may name a condition. "Do not take this if you have
  a history of skin cancer" is required information, not a claim.
- **Talking about claims.** Every article carries a passage explaining what the
  law does not let us say. Those sentences necessarily contain banned words.
- **The one authorised claim.** Seaking declares 75 µg of iodine per capsule, so
  "iodine contributes to normal thyroid function and to normal energy-yielding
  metabolism" is available on that page, quoted exactly, next to the figure. It
  is available nowhere else on this site. Do not paraphrase it and do not move
  it.

If the linter fires on something genuinely fine, add a `<!--lint-ok: reason-->`
to the line rather than weakening a rule.

## What is done

- **47 product pages**, `products/<handle>.html`, plus `shop.html` and
  `client-questions.html`.
- **Six journal articles.** The five new ones are anamu, pau d'arco, shilajit
  real versus fake, lion's mane fruiting body versus grain, and a pillar piece
  on how to read a supplement label. Between 2,500 and 3,400 words each.
- **Compliance tooling**: the rules, the voice guide, the schema, the linter.
- **Imagery**: 21 stock photographs replaced, and manifests written for every
  remaining frame.

## What is left

1. **Finish the imagery.** `node tools/gen-images.mjs --all` picks up anything
   missing and skips what exists. It writes a desktop `.jpg` and an 800px
   `-m.jpg` for each. If a frame fails it is listed in
   `data/images/.failed.json`, and rerunning is safe.
2. **Wire the homepage.** `index.html` still points at the old
   `product.html` and has no link to `shop.html`. It needs the shop in the nav
   and a section pointing at the new journal pieces.
3. **A visual pass.** Nothing here has had a proper design review at desktop and
   mobile. `node shot.mjs <url> <out.png>` takes screenshots, and
   `DSF=1 node shot.mjs <url> <out.png> mobile` does 390x844.
4. **The formulas need a second read.** That batch was the most sensitive
   rewriting on the site and its writer died just after saving. The data is
   complete and it passes the linter, but nobody has read it end to end.

## Things not to get wrong

- **No em dashes anywhere.** Not in copy, not in commits, not in comments. The
  linter checks. This is the client's standing rule.
- **British spelling.** Sulphur, colour, practise.
- **Nothing is invented.** Every price, count, dose and binomial comes from
  `data/products-source.md`, which is the live catalogue pulled on 8 September.
  Two numbers in the source already disagree with themselves and are logged
  rather than repeated.
- **`Prostrate` is deliberate.** It is the client's own spelling of that
  product. Do not correct it.
- **No pack photography.** Generated imagery shows the botanical, the mineral or
  the material, never a Herbase pack or a legible label, because a rendered pack
  is an invented product. `.gitignore` explains which real pack photos are
  banned and why. The one exception is the Northern Soul jar, whose label
  carries no claim.
- **Do not make this repo public.** `assets/fonts/soloist-expanded.woff2` is a
  commercial typeface licensed to Herbase, not to us.

## Two decisions the client has to make

These are his calls, not ours, and both should be put to him rather than solved.

1. **The three Shungite products.** The live listings claim EMF protection,
   antioxidant properties and water purification. None would survive an ASA
   challenge, so all of it is gone and those pages now describe a polished
   carbon-bearing stone from Karelia and nothing else. He will notice.
2. **The kit savings do not add up.** Every kit advertises a discount that
   disagrees with its own component prices. Four overstate it and one
   understates it. Overstating a saving is a pricing claim that Trading
   Standards takes seriously, so this needs correcting at source.

| Kit | Advertised | Actual |
|---|---|---|
| Athletes Kit | save £33 | £17.97 |
| Parasite Cleanse | save £15 | £4.98 |
| Cell Repair Kit | save £15 | £9.98 |
| Menopause Kit | save £15 | £19.98 |
| Mens Health Kit | save £20 | £14.98 |

Separately, the Cell Repair Kit is listed as genome therapy and tagged "jab
detox kit" and "vaccine damage". All of that is stripped from our pages, but the
tags are still live on his own site, which matters more than what we do here.

## There is a second branch

`feature/products-and-articles` was built on another machine at the same time as
this one. It covers overlapping ground: five journal articles including its own
shilajit and lion's mane pieces, and five hand-written product pages at the repo
root as `product-<name>.html`.

**Do not merge the two without a decision.** They diverge in two ways that
matter.

- **Architecture.** This branch generates `products/<handle>.html` from data and
  scales to all 47. That branch hand-writes five pages at the root. They cannot
  both stand.
- **Imagery.** That branch uses Unsplash and Wikimedia Commons photographs and
  credits them. The standing instruction as of 8 September is that found imagery
  is reference only and finals are generated or rendered by us, which is why
  every stock photograph on this branch was replaced.

The two article sets should be compared on merit and the better one kept for
each subject, rather than both being merged in.
