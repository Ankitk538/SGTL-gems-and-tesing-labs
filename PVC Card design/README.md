# Handoff: SG&TL PVC Report Card — integrate into `admin.html` print-report section

## Overview
A print-ready **PVC ID card** (CR80 / 85.6 × 54 mm + 3 mm bleed) that represents a gemstone
report — **Front** (report data + stone + QR + issued date + lab-director signature) and
**Back** (Terms & Conditions + social links + authentication badge). It must render inside
the **admin console's "Print Report" section** so an operator can print the physical card for
any given report.

## About the design files
`PVC Report Card (Final).html` in this bundle is a **design reference created in HTML** — a
pixel-accurate prototype of the intended look, not production code to paste verbatim. The task
is to **reproduce this card inside the existing `admin.html`** (vanilla HTML/CSS/JS, per the
SG&TL codebase) using its patterns, wired to live report data. The prototype's markup + scoped
CSS can be lifted almost directly because it is already vanilla and namespaced.

## Fidelity
**High-fidelity.** Colours, typography, spacing, and layout are final. Recreate pixel-for-pixel.

---

## ⚠️ Non-negotiable constraint (user's explicit instruction)
**Do NOT affect anything else in `admin.html`.** Only add the card to the print-report section.
- All card CSS is namespaced under the **`.sgtlpvc`** container class — keep it that way. Do not
  add un-namespaced/global selectors, and do not touch existing admin styles, scripts, or markup
  outside the print-report block.
- Inject the card markup only inside the existing print/report container. If a print-report
  section does not yet exist, add a self-contained one without altering sibling sections.

---

## Where it goes
Target: the **Print Report** section of `admin.html` (the flow that currently prints/exports a
report). Two acceptable integration modes — confirm with the product owner; default to **(B)**:
- **(A) Replace** the current print layout with this card.
- **(B) Add** a new **"Print PVC Card"** button/option alongside the existing report print, so
  both remain available. (Default.)

Print output should include **both Front and Back** (two artboards → two printed sides/pages).

---

## The card — structure

Two artboards. Each is `.card` = **1082 × 709 px** on screen (this is 91.6 × 60 mm incl. bleed,
authored at 300 DPI → 1 mm ≈ 11.811 px). Trim is 85.6 × 54 mm; safe zone is 4 mm inside trim.
Crop marks sit in the 3 mm bleed.

### Front (`.card.front`)
- **Header band** (`.hd`, full-bleed, height 150px, navy gradient): `<h1>` "SUNIL GEMS AND
  TESTING LABS" (Fraunces 700, 45px, gold, single line) + `.sub` "AUTHENTIC GEMOLOGY REPORT"
  (Inter 600, 22px, letter-spacing .24em, #eef1f6). The `.orn` div is intentionally **empty**
  (decorative diamonds were removed).
- **Watermark** (`.watermark`): `SG_logo.png`, opacity .06, centred behind the body.
- **Body** (`.body`, flex, two columns):
  - **Left `.fields`** — 12 rows, each `.row` = grid `236px 16px 1fr` → `.k` label (Inter 700,
    17px, UPPERCASE, colour `--label`), `.c` colon, `.v` value (Inter 600, 18px, UPPERCASE,
    colour `--ink`). Fields, in order:
    Report No. · Shapes / Cut · Carat · Clarity · Specimen Description · Weight · Colour ·
    Refractive Index · Optic Character · Specific Gravity · Party Name · Comments.
  - **Right `.side`** (width 246px, `align-items:center`): stone (`.gem`>`.oval`, CSS-drawn
    sapphire on **transparent** background), `.gname` (Fraunces 600, 20px, centred), `.qr`
    (122px, white padded box, `<img>` QR), `.issued` (label + date, centred), then the
    **signature** `<img class="sign">` (146×36, object-fit:scale-down).
- **Footer band** (`.ft`, full-bleed, 70px, navy): email (left) + website (right), each with a
  gold stroke SVG icon; `justify-content:space-between`, padding 0 96px.

### Back (`.card.back`)
- Same header band.
- **`.bbody`**: `.tc-pill` ("◆ Terms & Conditions ◆"), `.tc-text` (the full T&C paragraph),
  `.connect` ("STAY CONNECTED WITH US"), `.socials` (**Facebook, Instagram, WhatsApp only** —
  Email & YouTube were removed; plain **black glyphs, no background tiles**, 30px, fill #111417),
  and `.badge` `<img>` (authentication badge, 102×102, absolutely positioned).
- **Footer band**: centred text "Authenticity guaranteed only with the embossed laboratory seal."

> The standalone prototype also renders a **print-spec/QA panel** (`.pkg`) below the two cards.
> That panel is documentation only — **do not** include it in the admin integration.

---

## Design tokens (exact)
Declared on the `.sgtlpvc` container:
```
--navy:      #0a1c48    /* header/footer bands, crop marks */
--navy2:     #081634    /* gradient end */
--gold:      #d3a446    /* lab name, hairlines, icon stroke */
--gold2:     #b7862f
--gold-soft: #f0d69b    /* sub-labels on navy, T&C pill text */
--cream:     #ffffff    /* card background — WHITE */
--ink:       #14213f    /* field values, gem name */
--label:     #243156    /* field labels, issued label */
--line:      rgba(20,33,63,.16)  /* QR box border */
--u:         11.811px   /* px per mm @300 DPI */
```
Social glyph colour: **#111417**. Stone gradient blues: #2f6fd6 → #144aa8 → #0a2f7a → #06205a.
Header/footer band gradient: `linear-gradient(120deg,#0c2350,#0a1c48 55%,#081734)`.

## Typography
- **Fraunces** (serif, Google Fonts) — `<h1>` lab name (700/45px), gem name (600/20px),
  spec headings. Loaded via the prototype's `<link>`; the SG&TL site already loads Fraunces, so
  reuse the existing load — don't add a duplicate.
- **Inter** (sans) — sub-header, all field labels/values, T&C, footer, connect line.
- Sizes are already px-exact in the CSS. The whole `.sgtlpvc` block is rendered at `zoom:.82`
  in the prototype so both cards fit the preview — **remove/adjust that `zoom` for print**; the
  true card size is 1082×709 px per artboard.

## Interactions & behaviour
- No animations. Static print artefact.
- **Print:** provide a print path (button → `window.print()` or existing export). Each artboard
  should map to one physical side. Add `@media print` rules scoped to `.sgtlpvc` so only the card
  prints (hide admin chrome during that print action) — without disturbing existing admin print
  behaviour. Card is 85.6×54 mm at trim; set the print page/scale accordingly.

---

## Live data mapping (wire to the report record)
Replace the hard-coded sample values with the selected report's fields. Map admin/DB keys →
card slots:
| Card slot (front) | Sample value | Source field (adjust to your schema) |
|---|---|---|
| Report No. | SGTL2405180001 | `report_no` |
| Shapes / Cut | Oval Mixed Cut | `shape` + `cut` |
| Carat | 5.67 ct | `carat` |
| Clarity | Eye Clean | `clarity` |
| Specimen Description | Natural Blue Sapphire | `specimen` / `stone_name` |
| Weight | 6.23 Ratti | `weight` (+ unit) |
| Colour | Vivid Blue | `colour` |
| Refractive Index | 1.762 – 1.770 | `refractive_index` |
| Optic Character | Doubly Refractive | `optic_character` |
| Specific Gravity | 3.99 | `specific_gravity` |
| Party Name | Shankar Jewellers | `party_name` |
| Comments | Natural Inclusion(s) Pattern | `comments` |
| Gem name (right) | Natural Blue Sapphire | `stone_name` |
| Issued Date | 18 May 2024 | `issued_date` |

**QR code** must be generated per report, not the static PNG in this bundle. The SG&TL stack
already uses `api.qrserver.com`. Point the QR at the verification URL for that report, e.g.:
```
https://sgtlgemtesting.co.in/verify.html#verify?report=<REPORT_NO>
```
`<img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=<encoded verify URL>">`
Escape all field values before injecting (avoid HTML injection from DB text).

---

## Assets (in `assets/`)
- `SG_logo.png` — header logo watermark. **Use the copy already in the site's `assets/`.**
- `qr-sgtl.png` — sample QR **for preview only**; replace with the live-generated QR (see above).
- `signature.png` — lab-director signature (front). Original filename in the design project:
  `sign-design-v--mr9ex7e0.png`.
- `badge.png` — authentication badge (back). Original: `badge-design-v2-mr9lepar.png`.
Place `signature.png` and `badge.png` into the site's `assets/` and reference by relative path.

## Files in this bundle
- `PVC Report Card (Final).html` — the full standalone reference (Front + Back + spec panel).
  Lift the `.sgtlpvc` `<style>` block and the two `.card` blocks; drop the `.pkg` panel.
- `assets/` — logo, sample QR, signature, badge.

## Print/QA checklist (from the design brief)
- Trim 85.6 × 54 mm, bleed 3 mm, safe zone 4 mm — confirmed in geometry.
- 300 DPI raster; convert colours to CMYK (Coated FOGRA39) for the print house.
- QR ≥ 20 × 20 mm with 4 mm quiet zone; verify it scans at final size.
- Watermark opacity 6% — must not reduce legibility.
- No critical text/logo within 4 mm of trim.
- Outline fonts for the final PDF/X-1a export.
