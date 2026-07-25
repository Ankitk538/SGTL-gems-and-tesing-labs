# SG&TL Design System

**SG&TL — Sunil Gems & Stones Testing Laboratories** is an Indian gemological
certification lab (sgtlgemtesting.co.in). It tests and certifies precious and
semi-precious gemstones — diamonds, rubies, emeralds, sapphires, and all nine
**Navratna** stones — and issues tamper-proof reports with a unique report number
and QR code that anyone can verify online, 24/7. Founded in 2000, based in the
heart of India's gem trade (New Delhi area), it serves jewellers, traders, and
consumers with scientific identification, treatment disclosure, and origin
determination.

This design system codifies the visual language of that product — a theme the
codebase calls **"Crystalline Noir"**: pressurized darkness (a near-black navy
void) into which two chromatic veins emerge, *auric gold* and *subterranean
teal*, with a single *ruby* note reserved for errors. It is built so design
agents can produce on-brand SG&TL interfaces, marketing pages, certificates, and
mockups.

---

## Sources

Everything here was reverse-engineered from the live codebase (read-only mount,
`SGTL Project/`). Key files studied:

| File | Surface | Notes |
|---|---|---|
| `landing.html` | Marketing home (**dark**) | Hero, particles, features, pricing, contact modal, Supabase enquiry pipeline |
| `index.html` | Verification app (**light**) | Hero band, certificate lookup portal, services, testimonials, FAQ, **jsPDF** certificate generator |
| `admin.html` | Admin console (**dark**) | Login console, sidebar dashboard, metric cards, data tables, enquiry threads |
| `design-philosophy.md` | Brand doctrine | The "Crystalline Noir" essay (imprisoned light, facets, deep-earth palette) |
| `assets/SG_logo.png` | Logo | Interlocking **SG** serif monogram, navy + gold keyline |
| `assets/gem-report-hero.png` | Hero imagery | Macro of sapphire/ruby/emerald/diamonds + loupe on dark slate |
| `assets/sgtl-logo-animation.gif` | Animated mark | 800×600, 200-frame logo reveal (the "logo_animation_design") |

- **Live site:** https://sgtlgemtesting.co.in/
- **Tech stack (original):** Vanilla HTML5 + CSS3, client-side JS, Supabase, jsPDF, QR via api.qrserver.com.

> **Font note.** The original brief named *Playfair Display* for headings, but the
> shipped codebase migrated all display type to **Fraunces** (an explicit
> redesign step left in the CSS). Fraunces is treated as the source of truth.
> All four families (Fraunces, Inter, IBM Plex Mono, JetBrains Mono) load from
> **Google Fonts** via `tokens/fonts.css`. See *Caveats* at the bottom.

---

## Content fundamentals — how SG&TL writes

**Voice: authoritative, scientific, reassuring — never salesy.** The copy sells
*trust* and *precision*, not gemstones. It leans on instrument names and standards
to establish credibility, then softens into plain reassurance for nervous
first-time buyers.

- **Person.** Marketing addresses the reader as **"you"** ("Gemstone certification
  you can trust"); the lab refers to itself as **"we / our laboratory / SG&TL"**.
  Never first-person singular.
- **Casing.** **Sentence case** for headings and buttons ("Verify a Certificate",
  "Instant certificate lookup"). UPPERCASE is reserved for tiny **eyebrow labels**
  and status words ("REPORT VERIFICATION", "VERIFIED"), always letter-spaced.
- **Tone.** Confident and exact. Quantified claims do the heavy lifting:
  *"15,000+ reports issued," "99.9% accuracy," "500+ trade partners," "reports
  within 10 minutes."* Verbs are crisp and process-driven: **Submit · Analyse ·
  Certify · Verify.**
- **Vocabulary.** British/Indian-English spelling (**colour, jeweller, analyse**).
  Domain terms are used confidently and unglossed: *Raman spectroscopy, FTIR,
  UV-Vis-NIR, EDXRF, treatment disclosure, origin determination, Navratna,
  Neelam, Ratti.* Indian market framing is explicit ("India's gem trade",
  "Kashmir sapphires", astrological suitability of Navratna stones).
- **Length.** Headlines are short (3–6 words). Body blurbs are one tight sentence
  of ~18–28 words. Feature cards: a noun-phrase title + one explanatory sentence.
- **Microcopy.** Trust signals everywhere: "SSL Secured · ISO Certified ·
  Tamper-Proof · Instant Result". Status messages are plain and human
  ("Checking report…", "No matching report found for "X". Please check the
  number.").
- **Emoji:** **none in marketing/body copy.** A few Unicode glyphs appear as
  lightweight icons (see *Iconography*). Don't introduce emoji into prose.
- **Punctuation flourish:** the diamond glyph **◆ (`&#9670;`)** is the house mark —
  used as a bullet, badge dingbat, and feature-icon. The ampersand in **SG&TL**
  is always present (the full name is *Sunil Gems **&** Stones Testing
  Laboratories*).

Example copy that captures the vibe:
> ◆ Trusted by 500+ jewellers across India
> **Gemstone certification you can trust**
> India's premier gemological laboratory. Scientific precision, instant
> verification, and internationally recognized reports.

---

## Visual foundations

**Two surfaces, one palette.** The brand alternates between a **dark "void"** theme
(marketing landing + admin console) and a **light "paper"** theme (the
verification app). Both draw from the same gold/teal/ruby accent set.

### Color & vibe
- **The void.** Backgrounds are near-black warm navy (`--navy #0a1215`), layered
  with faint **radial "geode" glows** in gold and teal and a fixed darkened gem
  photograph. Color "never appears at full saturation except at singular focal
  points" — accents build through low-alpha layers.
- **Gold** (`--gold #c4943f`, soft `#f0d69b`, pale `#f2d99a`) is the primary
  accent: CTAs, the logo keyline, eyebrow labels, icon tint, hairline borders.
- **Teal** (`--teal #0d6b63` → dark `#084b46`) is the secondary vein: submit
  buttons, the "Verified" check, success states, check-list bullets.
- **Ruby** (`--ruby #a9253f`) appears only for errors / invalid lookups.
- **Imagery** is cool, dark, high-contrast, jewel-toned macro photography on
  slate — sapphire blue, ruby red, emerald green, white diamond, gold loupe.
  No warm filters, no grain.
- On **light** surfaces, text uses AAA-contrast inks (`--muted #39443f`,
  `--ink #0f1a17`); gold-as-text switches to `--gold-ink #6b4e1f` and
  teal-as-text to `--teal-ink #094c46` so accents stay legible.

### Typography
- **Fraunces** for all display headings — high-contrast old-style serif with
  optical sizing, tightened tracking (`-0.015em`), `text-wrap: balance`.
- **Inter** for everything functional (nav, body, buttons, labels), weights
  300–800.
- **IBM Plex Mono** (verification app) / **JetBrains Mono** (admin) for lab
  data — report numbers and spec values get `font-variant-numeric: tabular-nums`
  and slight letter-spacing, treated as "instrument readouts."
- Eyebrow labels: 11px, `700`, UPPERCASE, `letter-spacing: 0.2em`, gold, often
  preceded by a 24px gold rule.

### Backgrounds & texture
- Full-bleed dark gradients + multiple stacked radial glows; a fixed gem photo
  on the landing. Floating **particle dots** (gold, low-alpha) drift up the hero.
- No repeating patterns, no hand illustration, no noise/grain.

### Borders, radii, shadows
- **Hairlines:** crisp 1px, very low alpha — `rgba(196,148,63,0.12–0.16)` (gold)
  on dark, `--line #e2e8e5` on light.
- **Radii:** `sm 6px` (buttons/inputs), `md 10px`, `lg 16px` (cards),
  `xl 24px` (verify card / banners), `pill 999px` (badges, nav links).
- **Shadows:** soft and large on light (`--shadow-md/lg`); on dark, CTAs carry a
  **gold glow** (`0 8px 32px rgba(196,148,63,.30)`), modals a deep
  `0 32px 80px rgba(0,0,0,.55)` plus a faint gold halo.
- **Glassmorphism:** fixed headers and elevated cards use
  `backdrop-filter: blur(16–20px)` over `rgba` glass (`--glass-dark/light`).

### Motion
- **Signature easing** `cubic-bezier(0.4,0,0.2,1)` at **220ms** for all hovers /
  transitions; a springier `cubic-bezier(0.65,0,0.45,1)` for the verified
  check-mark stroke and pop-ins.
- **Entrances:** `fadeUp` (opacity 0→1, translateY 24px→0) over 600–800ms, with
  **staggered delays** (100/200/300/400ms) on hero elements and an
  IntersectionObserver replaying `fadeUp` on cards/sections as they scroll in.
- **Hover:** CTAs lift `translateY(-2px)` and deepen their glow; cards lift
  `translateY(-4px)`, brighten their fill a touch, and warm their border toward
  gold. Nav links shift color (muted → teal/white) + faint tinted background.
- **Press / focus:** inputs get a gold focus ring (`0 0 0 4px rgba(196,148,63,.08)`)
  and switch background paper→white; the verify card glows on `:focus-within`.
- The 200-frame logo GIF is the brand's hero "logo_animation_design".
- Respect `prefers-reduced-motion`: drop decorative loops, keep content visible.

### Layout
- Fixed/sticky glass header; fluid section rhythm (`--section-y` clamp 80–140px,
  `--section-x` clamp 24–80px). Content measures: hero 720px, prose 540px,
  feature grids ~1000px. Responsive grids via
  `repeat(auto-fit, minmax(…, 1fr))`. Stat strips are divided by thin vertical
  rules rather than boxed cards.

---

## Iconography

SG&TL has **no icon font and no SVG icon library.** Iconography is deliberately
minimal and built from three things:

1. **The diamond glyph ◆ (`&#9670;`)** — the house mark. Used as the feature-card
   icon (gold, in a soft `rgba(196,148,63,0.10)` rounded tile), as the badge
   dingbat, and as a bullet. This is the single most "SG&TL" glyph.
2. **Unicode dingbats** standing in for icons elsewhere: 🛡 (`&#128737;`,
   treatment/tamper-proof), 🌐 (`&#127758;`, origin), 📱 (`&#128241;`, QR), ★
   (`&#9733;`, Navratna / testimonial stars), 🔒 🔬 ⏳ ✅ (trust badges, lab).
   These are placeholders the brand uses literally — keep them as Unicode, tinted
   gold/teal, not recolored emoji art.
3. **A few inline functional SVGs**, hand-drawn per use, for *interactive*
   feedback only — the animated **verified check-mark** (circle + polyline, teal
   stroke, dash-offset animation) and the success-popup tick. Stroke style:
   `stroke-width 2–3`, `round` caps/joins, teal `#0d6b63`.

The **admin console** is the exception: it uses small inline stroke SVGs for nav
(dashboard, certificate, database, enquiries, security, settings) — 24×24,
`fill:none; stroke:currentColor; stroke-width:2`. If you need a richer icon set,
substitute **Lucide** (same 24px / 2px-stroke / round-join language) from CDN and
**flag the substitution** — it is not part of the original codebase.

> Assets live in `assets/`: `SG_logo.png` (monogram), `gem-report-hero.png`
> (hero photo), `sgtl-logo-animation.gif` (animated mark). Never redraw the logo;
> always reference these files.

---

## Index / manifest

**Root**
- `styles.css` — global entry point (import this). `@import`s the five token files.
- `readme.md` — this guide. · `SKILL.md` — Agent-Skills wrapper.

**Tokens** (`tokens/`) — `fonts.css` · `colors.css` · `typography.css` ·
`spacing.css` · `effects.css` (132 custom properties).

**Assets** (`assets/`) — `SG_logo.png` (monogram) · `gem-report-hero.png` (hero
photo) · `sgtl-logo-animation.gif` (animated mark).

**Foundation cards** (`guidelines/`) — 19 specimen cards on the Design System tab:
- *Colors* (6): void/navy, gold vein, teal vein, ruby & status, light surfaces, gradients & glows
- *Type* (5): Fraunces display, Inter body, mono lab-data, eyebrow, Inter weights
- *Spacing* (4): radii, shadows, spacing scale, motion (interactive)
- *Brand* (4): logo, animated mark, hero imagery, house glyph & icon tiles

**Components** (`components/`) — 11 React primitives, each with `.jsx` + `.d.ts` +
`.prompt.md` + a directory card. Read via `window.SGTLDesignSystem_3ded94`.
- `core/` — **Button** (gold/teal/ghost/outline), **Eyebrow**, **Badge** (hero/trust/solid)
- `forms/` — **TextInput** (body/mono/suffix), **VerifyField** (certificate lookup)
- `cards/` — **FeatureCard**, **PricingCard**, **MetricCard**, **DataField**
- `feedback/` — **StatItem** (divided trust stat), **VerifiedBadge** (animated check)

**UI kits** (`ui_kits/`) — full-surface recreations. Each is a **self-contained
vanilla** page (links `styles.css`) so it previews/exports standalone, mirroring
the component primitives.
- `marketing/index.html` — dark Crystalline Noir landing (Motion-animated). Also the
  standalone landing deliverable.
- `verification/index.html` — light certificate-lookup app (lookup → verified panel + QR).
- `admin/index.html` — dark admin console (sidebar, metric bento, certificate table, enquiries).

**Starting points** (consuming-project picker): Button, FeatureCard, VerifiedBadge,
VerifyField, + the three UI-kit screens (Marketing / Verification / Admin).
