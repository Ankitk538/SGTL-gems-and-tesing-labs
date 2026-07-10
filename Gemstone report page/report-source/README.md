# SGTL Gemstone Report — Final Design (editable source)

Drop these into your `SGTL Project` folder, then commit/push.

## Files
- **Gemstone Report (Final).dc.html** — the editable report design (open/edit this).
- **Gemstone Report (SGTL-311224PWP1894).html** — standalone, offline build (double-click to open). Self-contained.
- **support.js** — runtime required by the .dc.html.
- **_ds/** — SG&TL design system (tokens, components, bundle).
- **assets/SG_logo.png** — logo / watermark.
- **assets/SGTL-311224PWP1894.pdf** — the certificate PDF the Download button serves.
- **sign-mqmltjpt.png** — lab director signature.
- **badge-mqmlcsrw.png** — authentication seal.

## Keep the folder structure intact
The report references `support.js`, `_ds/`, `assets/`, and the sign/badge PNGs by
relative path. Moving files around will break those references.

## Behaviour
- **QR code** → `https://sgtlgemtesting.co.in/verify.html#verify?report=SGTL-311224PWP1894`
- **Download PDF** button → exports this report design as an A4 PDF.
- **Tweak controls** (in the editor): accent metal, security border, watermark.

## Report data shown
Natural Turquoise · 6.5 Ratti · Sky Blue · Oval Cabochon · RI 1.61–1.65 ·
SG 2.60–2.85 · Optic Character DR · Jeweller: Shankar Jewellers · Issued 31 Dec 2024.
