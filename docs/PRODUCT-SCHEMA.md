# Product entry schema

One JSON object per product. `tools/build.mjs` renders every shop card and
product page from these and nothing else, so anything missing here is missing
from the site.

```json
{
  "handle": "anamu-capsules",
  "name": "Anamu",
  "latin": "Petiveria alliacea",
  "subtitle": "Petiveria alliacea, 50 vegan capsules",
  "category": "botanicals",
  "price": "29.99",
  "variants": [{ "title": "50 capsules", "price": "29.99" }],
  "form": "Capsules",
  "standfirst": "One paragraph. What the thing is, where it comes from, what is in the pack. No effect language of any kind.",
  "body": [
    "Two to four paragraphs in Reiss's voice. Botany, origin, harvest, how it looks and smells, what is and is not in the capsule, why the pack is the size it is.",
    "Second paragraph."
  ],
  "spec": [
    ["Botanical name", "Petiveria alliacea"],
    ["Also called", "Guinea hen weed, mucura, tipi"],
    ["Family", "Petiveriaceae"],
    ["Part used", "Root and aerial parts"],
    ["Origin", "Caribbean and South America, organically grown"],
    ["Form", "Vegan capsule"],
    ["Capsules per pack", "50"],
    ["Other ingredients", "None. No fillers, binders or flow agents"]
  ],
  "dose": "One to two capsules a day with a meal and a large glass of water.",
  "supply": "Fifty capsules. At one a day that is about seven weeks.",
  "cautions": [
    "Not for use in pregnancy or while breastfeeding.",
    "Speak to your GP first if you take prescribed medication."
  ],
  "image": "anamu",
  "imageSubject": "A short art-direction line naming the physical subject to photograph. Botanical, mineral or material only. Never a pack, a jar or a label.",
  "queries": ["The listing sells 50 capsules and then calls one a day a 40-day supply. Which is right?"],
  "sourceTitle": "ANAMU CAPSULES - CELLULAR DEFENCE & IMMUNE SUPPORT"
}
```

## Field rules

- **`name`** is the product stripped of every claim. `PANCREA - DIABETES SUPPORT
  & PANCREAS CELL FORMULA` becomes `Pancrea`. `LION'S MANE - BRAIN & NERVE
  SUPPORT` becomes `Lion's Mane`. Keep the shop's own spelling of a proper name,
  including `Prostrate`, which is deliberate.
- **`subtitle`** replaces the claim suffix with specification. Botanical name and
  count, or the format and size. It is the line that does the work the old claim
  used to do, and it has to be genuinely informative.
- **`category`** is one of: `seamoss`, `botanicals`, `mushrooms`, `minerals`,
  `formulas`, `kits`, `library`, `service`, `apparel`.
- **`spec`** is the heart of the page. Eight to fourteen rows. Only rows you can
  source. A row you cannot fill becomes a line in `queries`, never a guess.
- **`cautions`** always has at least two entries. Safety copy is not a claim and
  there is no ceiling on it. For anything a pregnant reader should avoid, say so
  first and plainly.
- **`queries`** is what we need Reiss to confirm. Missing doses, missing
  botanicals, arithmetic that does not add up, ingredients named on a pack but
  not on the site. Be thorough here. It becomes the client's question list.
- **`sourceTitle`** preserves the live title verbatim so the diff is auditable.
- Kits list their contents in `spec` as one row per item, using our clean names.
- Books, the consultation and the t-shirts are not supplements. They take the
  same shape but their spec rows are format, page count, length, sizes, and so on.

Read `docs/COPY-RULES.md` before writing a word of `standfirst`, `body` or
`subtitle`. Read `docs/VOICE.md` for how they should sound.
