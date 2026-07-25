# Archive Manifest — SGTL Project

**Date:** 2026-07-25
**Branch:** branch_3
**Reason:** Codebase pruning — isolating files not required for build/runtime

---

## Unused Asset

| Archived File | Original Path | Reason |
|---|---|---|
| `assets/Sign.png` | `assets/Sign.png` | Replaced by `assets/sign_design_v2.png`; zero references in any HTML or JS file |

## Standalone Reference File

| Archived File | Original Path | Reason |
|---|---|---|
| `Gemstone_Report_Reference.html` | `Gemstone_Report_Reference.html` | Bundled design reference page; not linked from index, admin, or verify |

## Documentation Files

| Archived File | Original Path | Reason |
|---|---|---|
| `docs/design-philosophy.md` | `design-philosophy.md` | Design philosophy doc — not referenced at runtime |
| `docs/QA_AUDIT_REPORT_SGTL-31825SG2258.md` | `QA_AUDIT_REPORT_SGTL-31825SG2258.md` | One-time QA audit report — not part of the application |
| `docs/SGTL_Blueprint_v1.0.docx` | `SGTL_Blueprint_v1.0.docx` | Project blueprint document — planning artifact, not runtime |

## SQL Migration Scripts (One-Time)

| Archived File | Original Path | Reason |
|---|---|---|
| `sql/migration-enquiry-redesign.sql` | `migration-enquiry-redesign.sql` | One-time DB migration — already applied; not referenced by server code |
| `sql/supabase-policies.sql` | `supabase-policies.sql` | One-time RLS policy setup — already applied; not referenced by server code |

## Alternative Server Files

| Archived File | Original Path | Reason |
|---|---|---|
| `alt-servers/serve.py` | `serve.py` | Python dev server — not referenced by any script, package.json, or start.bat |
| `alt-servers/serve_local.js` | `serve_local.js` | Minimal Node dev server — superseded by admin-server.js and server.js |
| `alt-servers/serve_node.js` | `serve_node.js` | Another Node dev server — superseded by admin-server.js and server.js |

## Runtime Log Files

| Archived File | Original Path | Reason |
|---|---|---|
| `logs/admin-server-error.log` | `admin-server-error.log` | Runtime log output — not source code |
| `logs/admin-server.log` | `admin-server.log` | Runtime log output — not source code |
| `logs/server-err` | `server-err` | Runtime log output — not source code |
| `logs/server-err.log` | `server-err.log` | Runtime log output — not source code |
| `logs/server-out` | `server-out` | Runtime log output — not source code |
| `logs/server-out.log` | `server-out.log` | Runtime log output — not source code |
| `logs/server-stderr.log` | `server-stderr.log` | Runtime log output — not source code |
| `logs/server-stdout.log` | `server-stdout.log` | Runtime log output — not source code |

## Design Source Folders

| Archived Folder | Original Path | Reason |
|---|---|---|
| `Gemstone report page/` | `Gemstone report page/` | Design source files (HTML mockups, design system tokens, reference assets) — not served or referenced by the live website |
| `PVC Card design/` | `PVC Card design/` | PVC card design source files — referenced only in a CSS comment as a design origin note; not loaded at runtime |
| `.od-skills/` | `.od-skills/` | Open Design agent skill definitions — tooling artifact, not part of the website |

---

## Files Kept (Essential)

For reference, the following files were analyzed and confirmed as **in-use**:

**Entry points:** `index.html`, `admin.html`, `verify.html`
**Servers:** `admin-server.js` (npm start), `server.js` (npm run serve), `load-env.js`
**Client libs:** `html2canvas.min.js`, `jspdf.umd.min.js`, `qrcode.min.js`
**Assets:** `assets/SG_logo.png`, `assets/Badge.png`, `assets/badge_design_v2.png`, `assets/sign_design_v2.png`, `assets/gem-report-hero.png`, `assets/QR Code.png`, `assets/SGTL QR code.png`
**Config/Deploy:** `.env`, `.env.example`, `.gitignore`, `CNAME`, `_redirects`, `vercel.json`, `robots.txt`, `sitemap.xml`, `package.json`, `package-lock.json`, `start.bat`
**Dependencies:** `node_modules/` (managed by npm)
