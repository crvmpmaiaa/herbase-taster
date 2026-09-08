# Copy rules for the Herbase build

These are not house style. They are the law this shop trades under, written down
so nobody has to guess. Every page on this site was written against them and
`tools/claim-lint.mjs` checks the built HTML against them mechanically.

## The one sentence version

**The brand states specification. The customer states effect.**

We publish what is in the jar, where it came from, how much of it there is and
what to do with it. We do not publish what it does to a body. That half belongs
to reviews, to the consultation, and to the customer's own experience.

## Why

Herbase sells food supplements in England. Three regimes apply at once.

1. **Retained Regulation 1924/2006.** A health claim is any statement that
   suggests a relationship between a food and health. Only claims on the GB
   Nutrition and Health Claims Register may be made, they attach to a named
   nutrient rather than to a plant, and the product must contain enough of that
   nutrient to qualify. Every botanical claim is on hold and none of them are
   usable.
2. **Human Medicines Regulations 2012.** A product presented as treating or
   preventing disease is a medicine. Presentation alone is enough. The MHRA does
   not need to test anything.
3. **Section 4, Cancer Act 1939.** Advertising anything as a treatment for
   cancer is a criminal offence, prosecuted by Trading Standards.

The CAP Code treats our blog, our product pages and our customers' testimonials
as our marketing. Server location is irrelevant. So is a disclaimer.

## Banned outright

No page may say, or imply, that a product does anything to a body.

- **Verbs, where a body or a body part is the object:** supports, helps, aids,
  promotes, boosts, enhances, improves, restores, regulates, balances, cleanses,
  detoxifies, purifies, flushes, repairs, rebuilds, protects, defends, fights,
  kills, combats, reduces, relieves, eases, soothes, calms, strengthens,
  nourishes, revitalises, rejuvenates, optimises, heals, treats, cures, prevents.
- **Any named condition or disease.** Diabetes, candida, parasites, herpes,
  cancer, arthritis, IBS, hypothyroidism, menopause, anxiety, insomnia, acne,
  infection, inflammation, high blood pressure, and every other one. This holds
  even in a product's own name: the live shop's `PANCREA - DIABETES SUPPORT`
  becomes `Pancrea` on our pages and nothing else.
- **Body systems and functions as a benefit.** Immune, immunity, hormonal
  balance, blood sugar, circulation, cellular energy, gut health, brain and
  nerve, thyroid function, prostate, adrenal, oxygenation, absorption, uptake.
- **Antimicrobial pharmacology.** Antiviral, antibacterial, antifungal,
  antiparasitic, antimicrobial, anti-inflammatory, antioxidant as a benefit.
- **Weasel framing does not rescue any of the above.** "May support", "is
  traditionally used to treat", "customers tell us it helps", "not intended to
  diagnose" and a footnote are all the same claim with a hedge attached.
- **Detox as a promise.** The word survives only as the proper name of a product
  or a book that is already called that (Detox Redox, 28 Day Detox Kit). It never
  describes an effect.

## Permitted, and where the writing should go instead

- Botanical name, common names, family, plant part, country and method of harvest.
- Form, capsule or gram count, fill weight, extract ratio, standardisation, and
  what the pack does not contain.
- The dose exactly as the shop prints it, and the arithmetic of how long a pack
  lasts at that dose.
- Price, variants, availability, and what is in a kit.
- Sensory description. Colour, texture, smell, how it behaves in water.
- Botany, geography, trade history, and the plant's place in a cuisine or a
  culture, described as history rather than as a purpose.
- Cautions, contraindications and who should not take it. Safety information is
  not a health claim and is always allowed. Publish more of it, not less.
- **Authorised nutrient claims, but only with the number printed.** Seaking
  declares 75 µg of iodine per capsule, so "iodine contributes to normal thyroid
  function and to normal energy-yielding metabolism" is available on that page and
  nowhere else on this site. The claim is attached to the nutrient, the figure is
  shown next to it, and the word "normal" stays in.

## The honesty section

Every long article carries a short passage saying plainly what the law allows us
to claim and why the rest of the internet says more. It is not a disclaimer at
the bottom. It sits in the body, in Reiss's voice, and it converts, because a
seller who tells you what they are not allowed to say reads as the only honest
one in the category.

## Nothing is invented

Every price, dose, count, botanical name and quantity on this site is lifted from
source: `herbase.earth/products.json?limit=250`, the shop's own labels, or the
Google Business Profile. Where a figure is missing we leave it out and log the
question in `data/queries.md` for Reiss to answer. We never write a plausible
number.

Two live-listing numbers already disagree with themselves and are logged rather
than repeated: the Anamu listing sells 50 capsules and then calls one a day a
40-day supply, and the sea moss gel has no printed per-spoon iodine figure.

## Imagery

Generated imagery shows the botanical, the mineral or the material. It never
shows a Herbase pack, a label or a jar that the shop does not actually sell,
because a rendered pack shot is an invented product. The one real pack photograph
on this site is the Northern Soul jar from the live listing, whose label carries
no claim. Every other pack image in `.gitignore` carries a claim on the label and
stays out until the labels are reprinted.
