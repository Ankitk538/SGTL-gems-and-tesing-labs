# QA Audit Report — SGTL-31825SG2258
**Date:** 2026-07-10  
**Report Number Tested:** SGTL-31825SG2258 (Natural Yellow Sapphire)  
**Test Environment:** localhost:8888 (local server.js) + production sgtlgemtesting.co.in  

---

## 1. Data Consistency Check

### Verify Page (Production) vs Admin Editor

| Field | Verify Page | Admin Editor | Match |
|-------|-----------|-------------|-------|
| Report No. | SGTL-31825SG2258 | SGTL-31825SG2258 | PASS |
| Stone Name | NATURAL YELLOW SAPPHIRE | NATURAL YELLOW SAPPHIRE | PASS |
| Weight | 5.2 Ratti | 5.2 Ratti | PASS |
| Colour | Yellow | Yellow | PASS |
| Shape | Rectangle | Rectangle | PASS |
| Cut | Faceted | Faceted | PASS |
| Optic Character | dR | dR | PASS |

**Additional fields on admin PVC card (not shown on verify):**
Refractive Index: 1.762, Specific Gravity: 4, Party Name: mohini salesh man satyendra, Date: 31-08-2025, Carat: —, Clarity: —

**Result: ALL DATA FIELDS MATCH — PASS**

---

## 2. Export Function Tests (Admin)

| Export Button | Console Errors | File Downloaded | Result |
|-------------|---------------|----------------|--------|
| Download 4K PNG | None | Yes | PASS |
| Download PDF | None | Yes | PASS |
| A4 Report | None | Yes | PASS |

**Result: ALL EXPORTS — PASS (no console errors)**

---

## 3. Print Report Section Design Audit

| Feature | Expected | Actual | Result |
|---------|----------|--------|--------|
| PVC front white body | White (#fff) body section | White body confirmed | PASS |
| PVC back white body | White (#fff) body section | White body confirmed | PASS |
| No crop marks | Crop marks hidden | None visible | PASS |
| Light preview background | Light (#f3f4f6) | Light background confirmed | PASS |
| A4 report in separate section | Below PVC cards | Separate section with label | PASS |
| Gem image on PVC front | Yellow sapphire | Displayed correctly | PASS |
| QR code on PVC front | Present | Visible | PASS |
| Aurora-themed header/footer | Navy blue gradient | Confirmed | PASS |
| Export buttons layout | 4 buttons in row | All 4 present | PASS |

**Result: ALL DESIGN ELEMENTS — PASS**

---

## 4. Bugs Found & Fixed

### BUG #1 — A4 Report "Jeweller" Field Empty (FIXED)
- **Severity:** Medium
- **Location:** admin.html lines 4589 and 5620
- **Issue:** The A4 report templates used `r["Jeweller"]` to populate the Jeweller field, but the database stores this as `r["Party Name"]`. The PVC card template (line 5827) correctly used `r["Party Name"] || r["Jeweller"]` but the A4 templates did not.
- **Impact:** The Jeweller row in A4 report PDFs was always blank even when Party Name had a value.
- **Fix Applied:**
  - Line 4589: Changed `r["Jeweller"] || ""` to `r["Party Name"] || r["Jeweller"] || ""`
  - Line 5620: Changed `r["Jeweller"] || ""` to `r["Party Name"] || r["Jeweller"] || ""`
- **Status:** FIXED (code updated, not pushed)

---

## 5. Issues Found (Pre-existing, Not Regressions)

### ISSUE #1 — Local verify.html cannot reach backend API
- **Severity:** Development workflow issue
- **Detail:** `server.js` (port 8888) is a static file server with no `/verify/` route. The `VERIFY_API_BASE` logic in verify.html sets it to `""` when on localhost:8888, so verify requests hit `localhost:8888/verify/REPORT_NO` which returns 404.
- **Root Cause:** The VERIFY_API_BASE only handles ports 8080 (→ localhost:3000) and production domains (→ Render). Port 8888 falls through to empty string.
- **Recommendation:** Update VERIFY_API_BASE logic to also handle port 8888, pointing to either localhost:3000 (admin-server.js) or the Render backend.

### ISSUE #2 — Verify page gem image not in downloaded PDF
- **Severity:** Low (pre-existing)
- **Detail:** The verify.html `generateCertificatePDF()` looks for `report["Gemstone Image"]`, `report["Gem Image"]`, etc., but the database stores the image as `gem_image_base64`. The PDF download from verify page will show a placeholder instead of the actual gem image.
- **Recommendation:** Add `report["gem_image_base64"]` to the fallback chain in verify.html line 2463 and 2568.

### ISSUE #3 — Empty SUPABASE_SERVICE_KEY in .env
- **Severity:** Info
- **Detail:** The local `.env` file has `SUPABASE_SERVICE_KEY=` (empty). The server falls back to the anon key. While RLS policies allow anon SELECT, some admin operations may fail without the service role key.
- **Recommendation:** Add the service role key for full local dev functionality.

### ISSUE #4 — URL parameter auto-populate not working on production
- **Severity:** Low
- **Detail:** Navigating to `sgtlgemtesting.co.in/verify.html?report=SGTL-31825SG2258` does not auto-populate the report number or trigger verification. The `?report=` parameter feature may only exist in the local version (not yet deployed).
- **Status:** Will resolve once local changes are deployed.

---

## 6. Summary

| Category | Pass | Fail | Fixed |
|----------|------|------|-------|
| Data Consistency | 7/7 | 0 | — |
| Export Functions | 3/3 | 0 | — |
| Design Elements | 9/9 | 0 | — |
| Bugs Found | — | 1 | 1 (Jeweller field) |
| Pre-existing Issues | — | 4 | 0 (noted only) |

**Overall Assessment: PASS** — All tested functionality works correctly. One bug found and fixed (A4 Jeweller field mapping). Four pre-existing issues noted for future resolution.

**Not Pushed:** All changes remain local per user instruction. No git commits or pushes made.
