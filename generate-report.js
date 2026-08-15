// ═══════════════════════════════════════════════════════════════
// generate-report.js — Server-side A4 Gemstone Report PDF Generator
// Endpoint: GET /certificate/:reportNo/pdf
// Security: authMiddleware (JWT + admin-only), DB-fetch only, no client data
// ═══════════════════════════════════════════════════════════════
"use strict";

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

// ─── Asset loader: base64-encode local images once at startup ───
const ASSETS_DIR = path.join(__dirname, "assets");
function loadAssetBase64(filename) {
  const filePath = path.join(ASSETS_DIR, filename);
  if (!fs.existsSync(filePath)) return "";
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filename).slice(1).toLowerCase();
  const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

// Pre-load assets at require-time (once)
const LOGO_B64 = loadAssetBase64("SG_logo.png");
const SIGN_B64 = loadAssetBase64("sign_design_v2.png");
const BADGE_B64 = loadAssetBase64("badge_design_v2.png");

// ─── HTML escape ───
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Build the 12 report fields from a DB record ───
function buildFields(r, reportNo) {
  return [
    { label: "Report No", val: reportNo || r["Report No."] || "", mono: true },
    { label: "Specimen Description", val: r["Stone Name"] || "" },
    { label: "Weight", val: r["Weight"] ? r["Weight"] + " " + (r["Weight Type"] || "Ratti") : "", mono: true },
    { label: "Shapes / Cut", val: [r["Shapes"], r["Cut"]].filter(Boolean).join(" ") || "" },
    { label: "Colour", val: r["Colour"] || "" },
    { label: "Clarity", val: r["Clarity"] || "" },
    { label: "Carat", val: r["Carat"] ? r["Carat"] + " ct" : "" },
    { label: "Refractive Index", val: r["Refractive Index"] || "", mono: true },
    { label: "Optic Character", val: r["Optic Character"] || "" },
    { label: "Specific Gravity", val: r["Specific Gravity"] || "", mono: true },
    { label: "Party Name", val: r["Party Name"] || r["Jeweller"] || "" },
    { label: "Comments", val: r["Comment"] || r["Magnification"] || "" }
  ];
}

// ─── Render field rows HTML (matches admin.html populateGemReport styles exactly) ───
function renderFieldsHTML(fields) {
  const sep = '<div style="grid-column:1/-1;height:1px;background:rgba(28,43,82,0.18);"></div>';
  let html = sep;
  for (const f of fields) {
    let valStyle = "font-family:'IBM Plex Mono',monospace;font-size:13.5px;line-height:1.5;color:#1c2b52;padding:8.5px 0;text-align:right;";
    if (f.mono) valStyle += "font-variant-numeric:tabular-nums;";
    html += '<div style="font-family:\'Inter\',sans-serif;font-size:13.5px;line-height:1.5;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:#5a6470;padding:8.5px 20px 8.5px 4px;">' + esc(f.label) + "</div>";
    html += '<div style="' + valStyle + '">' + esc(f.val) + "</div>";
    html += sep;
  }
  return html;
}

// ─── Corner ornament SVG ───
const ORNAMENT_SVG = '<svg width="66" height="66" viewBox="0 0 66 66" fill="none"><g stroke="#1c2b52" stroke-width="1.2" stroke-linecap="round"><path d="M10 10 C 10 32 24 46 46 46"/><path d="M10 10 C 32 10 46 24 46 46" stroke-opacity="0.45"/><path d="M46 46 C 34 46 25 37 25 25 C 25 19 30 15 36 16"/><path d="M25 25 C 25 31 30 35 36 34"/></g><circle cx="36" cy="25" r="2.4" fill="#c4943f"/></svg>';

// ─── Build full standalone HTML page for rendering ───
function buildReportHTML(record, reportNo, qrDataUrl, gemImageUrl) {
  const fields = buildFields(record, reportNo);
  const fieldsHTML = renderFieldsHTML(fields);
  const stoneName = esc(record["Stone Name"] || "Gemstone");
  const issuedDate = "Issued " + esc(record["Date"] || "");

  // Gem image box content
  let imgBoxContent;
  if (gemImageUrl) {
    imgBoxContent = '<img src="' + gemImageUrl + '" style="width:100%;height:100%;object-fit:cover;">';
  } else {
    imgBoxContent = '<svg width="52" height="52" viewBox="0 0 64 64" fill="none" stroke="#1c2b52" stroke-width="1.5" stroke-linejoin="round"><path d="M14 26 L24 13 L40 13 L50 26 L32 53 Z"/><path d="M14 26 L50 26"/><path d="M24 13 L28 26 L32 53"/><path d="M40 13 L36 26 L32 53"/></svg>' +
      '<span style="font-family:\'Inter\',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#5a6470;">Specimen image</span>';
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Fraunces:wght@600&family=IBM+Plex+Mono:wght@400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #fff; }
</style>
</head>
<body>
<div style="width:794px;height:1123px;background:#fff;position:relative;overflow:hidden;font-family:'Inter',sans-serif;color:#1c2b52;">
  <!-- Watermark -->
  <img src="${LOGO_B64}" alt="" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:540px;height:540px;object-fit:contain;opacity:0.05;pointer-events:none;">
  <!-- Corner ornaments -->
  <div style="position:absolute;top:54px;left:54px;">${ORNAMENT_SVG}</div>
  <div style="position:absolute;top:54px;right:54px;transform:scaleX(-1);">${ORNAMENT_SVG}</div>
  <div style="position:absolute;bottom:54px;left:54px;transform:scaleY(-1);">${ORNAMENT_SVG}</div>
  <div style="position:absolute;bottom:54px;right:54px;transform:scale(-1,-1);">${ORNAMENT_SVG}</div>
  <!-- Main content -->
  <div style="position:relative;z-index:1;display:flex;flex-direction:column;height:100%;padding:74px 74px 64px;">
    <!-- Header -->
    <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
      <img src="${LOGO_B64}" alt="SGTL" style="width:58px;height:58px;object-fit:contain;">
      <div style="font-family:'Fraunces',serif;font-size:19px;font-weight:600;letter-spacing:0.04em;color:#1c2b52;">SGTL Testing Labs</div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:40px;height:1px;background:#c4943f;"></span>
        <span style="font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#6b4e1f;">Gemstone Identification Report</span>
        <span style="width:40px;height:1px;background:#c4943f;"></span>
      </div>
    </div>
    <!-- Title -->
    <div style="text-align:center;margin-top:18px;">
      <div style="font-family:'Fraunces',serif;font-size:44px;font-weight:600;letter-spacing:-0.012em;color:#1c2b52;">Certificate of Authenticity</div>
      <div style="font-family:'Inter',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.26em;text-transform:uppercase;color:#5a6470;margin-top:8px;">Of Gemstone Identification</div>
    </div>
    <!-- Body: data table + right column -->
    <div style="display:flex;gap:32px;margin-top:36px;">
      <!-- Data table -->
      <div style="flex:1.3;display:grid;grid-template-columns:auto 1fr;align-items:center;align-content:start;">
        ${fieldsHTML}
      </div>
      <!-- Right column -->
      <div style="width:208px;flex:none;display:flex;flex-direction:column;align-items:center;">
        <div style="width:200px;height:178px;border:none;background:rgba(255,255,255,0.5);position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;overflow:hidden;">
          ${imgBoxContent}
        </div>
        <div style="font-family:'Fraunces',serif;font-size:21px;font-weight:600;color:#1c2b52;margin-top:4px;text-align:center;align-self:center;">${stoneName}</div>
        <div style="position:relative;width:96px;height:96px;margin-top:14px;">
          <img src="${qrDataUrl}" alt="QR" style="width:100%;height:100%;display:block;">
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:24px;height:24px;background:#fff;border-radius:4px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px #fff;">
            <img src="${LOGO_B64}" alt="" style="width:20px;height:20px;object-fit:contain;">
          </div>
        </div>
        <div style="font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#5a6470;margin-top:8px;">Scan to verify</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#5a6470;margin-top:4px;">${issuedDate}</div>
      </div>
    </div>
    <!-- Footer: signature -->
    <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;">
      <div>
        <img src="${SIGN_B64}" alt="Signature" style="width:113px;height:33px;object-fit:cover;display:block;">
        <div style="width:113px;height:1px;background:#1c2b52;margin:7px 0;"></div>
        <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#5a6470;text-align:center;">LAB DIRECTOR</div>
      </div>
    </div>
    <!-- Bottom bar -->
    <div style="border-top:1px solid rgba(28,43,82,0.18);margin-top:16px;padding-top:12px;display:flex;justify-content:center;align-items:center;gap:14px;font-family:'Inter',sans-serif;font-size:11.5px;color:#5a6470;">
      <span>www.sgtlgemtesting.co.in</span>
    </div>
    <div style="text-align:center;font-family:'Inter',sans-serif;font-size:10px;letter-spacing:0.04em;color:#9aa0a6;margin-top:6px;">Computer-generated certificate of authenticity</div>
    <img src="${BADGE_B64}" alt="Badge" style="position:absolute;left:586px;top:920px;width:76px;height:78px;object-fit:cover;">
  </div>
</div>
</body>
</html>`;
}

// ─── Generate QR code data URL server-side ───
async function generateQrDataUrl(reportNo) {
  const verifyUrl = "https://sgtlgemtesting.co.in/verify.html#verify?report=" + encodeURIComponent(reportNo || "");
  return QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 360,
    color: { dark: "#000000", light: "#ffffff" }
  });
}

// ─── Fetch gem image as base64 from Supabase Storage ───
async function fetchGemImageBase64(supabaseAdmin, reportNo) {
  try {
    const filePath = `${reportNo}.jpg`;
    const { data, error } = await supabaseAdmin.storage
      .from("gem-images")
      .download(filePath);
    if (error || !data) return null;
    const buf = Buffer.from(await data.arrayBuffer());
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// Module export: call with (app, deps) to mount the route
// ═══════════════════════════════════════════════════════════════
module.exports = function mountReportRoute(app, deps) {
  const { authMiddleware, adminDbClient, supabaseAdmin, decryptRecord, normalizeReportNo, logAudit } = deps;

  // Rate limiter specific to PDF generation (expensive operation)
  const rateLimit = require("express-rate-limit");
  const pdfLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute
    max: 10,               // 10 PDFs per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many PDF requests. Please wait." },
    keyGenerator: (req) => req.ip
  });

  // ── GET /certificate/:reportNo/pdf ──
  // Auth-required, DB-fetched, server-rendered PDF download
  app.get("/certificate/:reportNo/pdf", pdfLimiter, authMiddleware, async (req, res) => {
    let browser = null;
    try {
      // 1. Validate & normalize report number (server-side only)
      const rawParam = req.params.reportNo;
      const reportNo = normalizeReportNo(rawParam);
      if (!reportNo || reportNo.length > 30) {
        return res.status(400).json({ error: "Invalid report number" });
      }

      // 2. Fetch record from DB by Report No. (never trust client data)
      let record, fetchErr;
      ({ data: record, error: fetchErr } = await adminDbClient(req)
        .from("sgtl_database")
        .select("*")
        .eq('"Report No."', reportNo)
        .single());

      // Fallback: try by numeric No. column
      const numericNo = Number(reportNo);
      if ((fetchErr || !record) && Number.isFinite(numericNo)) {
        ({ data: record, error: fetchErr } = await adminDbClient(req)
          .from("sgtl_database")
          .select("*")
          .eq('"No."', numericNo)
          .single());
      }

      if (fetchErr || !record) {
        return res.status(404).json({ error: "Certificate not found" });
      }

      // 3. Decrypt the record
      const decrypted = decryptRecord(record);
      const finalReportNo = decrypted["Report No."] || reportNo;

      // 4. Generate QR code (server-side, not from client)
      const qrDataUrl = await generateQrDataUrl(finalReportNo);

      // 5. Fetch gem image from Supabase Storage
      const gemImageB64 = await fetchGemImageBase64(supabaseAdmin, finalReportNo);

      // 6. Build the HTML (exact same template as admin.html A4 report)
      const html = buildReportHTML(decrypted, finalReportNo, qrDataUrl, gemImageB64);

      // 7. Render to PDF via Puppeteer
      const puppeteer = require("puppeteer");
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--font-render-hinting=none"
        ]
      });
      const page = await browser.newPage();

      // Set viewport to A4 pixel dimensions (794×1123 at 96dpi)
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

      // Load the HTML content, wait for fonts + images
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });

      // Wait for Google Fonts to load
      await page.evaluate(() => document.fonts.ready);

      // Generate PDF matching the exact A4 template dimensions
      // Using screenshot→JPEG→PDF to match html2canvas pipeline output
      const screenshot = await page.screenshot({
        type: "jpeg",
        quality: 95,
        clip: { x: 0, y: 0, width: 794, height: 1123 }
      });

      await browser.close();
      browser = null;

      // 8. Build PDF from screenshot (matches admin.html's jsPDF output)
      const { jsPDF } = require("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [210, 297]
      });
      // Convert screenshot buffer to base64 for jsPDF
      const imgBase64 = "data:image/jpeg;base64," + screenshot.toString("base64");
      doc.addImage(imgBase64, "JPEG", 0, 0, 210, 297);
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

      // 9. Audit log
      logAudit("REPORT_PDF_GENERATED", req.user.email, { reportNo: finalReportNo, method: "server-side" });

      // 10. Send PDF response
      const safeFilename = finalReportNo.replace(/[^a-zA-Z0-9_-]/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="SGTL_Report_${safeFilename}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader("Cache-Control", "no-store");
      res.send(pdfBuffer);

    } catch (err) {
      if (browser) try { await browser.close(); } catch (_) {}
      console.error("[generate-report] PDF generation failed:", err.message);
      logAudit("REPORT_PDF_ERROR", req.user?.email || "unknown", { error: err.message, reportNo: req.params.reportNo });
      res.status(500).json({ error: "PDF generation failed" });
    }
  });
};
