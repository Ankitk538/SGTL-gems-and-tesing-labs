# SGTL Redesign — v2

Three complete design variants of the SGTL (Gemological Testing Laboratory) site.
Static HTML + CSS, one shared JS file for the report-verify demo. No build step.

Open `index.html` to pick a variant, or open any variant's `index.html` directly.

```
sgtl-redesign-v2/
├── index.html        ← chooser (links all three)
├── verify.js         ← shared report-lookup demo (swap for a real API call)
├── luxury/           ← Variant 1: warm ivory, serif, emerald+gold
├── technical/        ← Variant 2: cool white, grotesk+mono, cobalt, spec/data
└── minimal/          ← Variant 3: soft white, rounded sans, violet, bento
    └── {index, services, about, verify}.html + style.css
```

**Notes**
- Report verification uses three in-memory sample records in `verify.js`. Replace
  `lookup()` with a `fetch()` to the real SGTL database to go live.
- Copy is deliberately non-fabricated: no invented stats, counts or accreditations.
- Your original files were untouched — everything here is new.
