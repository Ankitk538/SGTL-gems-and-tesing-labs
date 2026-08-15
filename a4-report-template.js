/**
 * a4-report-template.js — Single Source of Truth for A4 Certificate of Authenticity
 * Used by: admin.html (preview + PDF export) and verify.html (PDF export)
 *
 * API:
 *   A4Report.injectTemplate(containerId)   — inject template HTML into a container div
 *   A4Report.populate(containerId, data)    — populate fields from certificateData object
 *
 * data = {
 *   record:          {},           // the report row from DB
 *   qrDataUrl:       "data:...",   // QR code data URL
 *   gemImageDataUrl:  "data:...",  // gem image data URL (or null)
 *   reportNumber:     "SGTL-..."   // optional override for Report No.
 * }
 */
var A4Report = (function () {
  "use strict";

  // ─── Escape HTML helper ───
  function esc(s) {
    if (!s) return "";
    var d = document.createElement("div");
    d.textContent = String(s);
    return d.innerHTML;
  }

  // ─── Build the static template HTML ───
  // IDs are prefixed with a token that callers replace per-instance
  function templateHTML(idPrefix) {
    var p = idPrefix || "a4r";
    return (
      '<div style="width:794px;height:1123px;background:#fff;position:relative;overflow:hidden;font-family:\'Inter\',sans-serif;color:#1c2b52;">' +
        /* Watermark */
        '<img src="assets/SG_logo.png" alt="" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:540px;height:540px;object-fit:contain;opacity:0.05;pointer-events:none;">' +
        /* Corner ornaments */
        '<div style="position:absolute;top:54px;left:54px;"><svg width="66" height="66" viewBox="0 0 66 66" fill="none"><g stroke="#1c2b52" stroke-width="1.2" stroke-linecap="round"><path d="M10 10 C 10 32 24 46 46 46"/><path d="M10 10 C 32 10 46 24 46 46" stroke-opacity="0.45"/><path d="M46 46 C 34 46 25 37 25 25 C 25 19 30 15 36 16"/><path d="M25 25 C 25 31 30 35 36 34"/></g><circle cx="36" cy="25" r="2.4" fill="#c4943f"/></svg></div>' +
        '<div style="position:absolute;top:54px;right:54px;transform:scaleX(-1);"><svg width="66" height="66" viewBox="0 0 66 66" fill="none"><g stroke="#1c2b52" stroke-width="1.2" stroke-linecap="round"><path d="M10 10 C 10 32 24 46 46 46"/><path d="M10 10 C 32 10 46 24 46 46" stroke-opacity="0.45"/><path d="M46 46 C 34 46 25 37 25 25 C 25 19 30 15 36 16"/><path d="M25 25 C 25 31 30 35 36 34"/></g><circle cx="36" cy="25" r="2.4" fill="#c4943f"/></svg></div>' +
        '<div style="position:absolute;bottom:54px;left:54px;transform:scaleY(-1);"><svg width="66" height="66" viewBox="0 0 66 66" fill="none"><g stroke="#1c2b52" stroke-width="1.2" stroke-linecap="round"><path d="M10 10 C 10 32 24 46 46 46"/><path d="M10 10 C 32 10 46 24 46 46" stroke-opacity="0.45"/><path d="M46 46 C 34 46 25 37 25 25 C 25 19 30 15 36 16"/><path d="M25 25 C 25 31 30 35 36 34"/></g><circle cx="36" cy="25" r="2.4" fill="#c4943f"/></svg></div>' +
        '<div style="position:absolute;bottom:54px;right:54px;transform:scale(-1,-1);"><svg width="66" height="66" viewBox="0 0 66 66" fill="none"><g stroke="#1c2b52" stroke-width="1.2" stroke-linecap="round"><path d="M10 10 C 10 32 24 46 46 46"/><path d="M10 10 C 32 10 46 24 46 46" stroke-opacity="0.45"/><path d="M46 46 C 34 46 25 37 25 25 C 25 19 30 15 36 16"/><path d="M25 25 C 25 31 30 35 36 34"/></g><circle cx="36" cy="25" r="2.4" fill="#c4943f"/></svg></div>' +
        /* Main content area */
        '<div style="position:relative;z-index:1;display:flex;flex-direction:column;height:100%;padding:74px 74px 64px;">' +
          /* Header */
          '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;">' +
            '<img src="assets/SG_logo.png" alt="SG&amp;TL" style="width:58px;height:58px;object-fit:contain;">' +
            '<div style="font-family:\'Fraunces\',serif;font-size:19px;font-weight:600;letter-spacing:0.04em;color:#1c2b52;">SGTL Testing Labs</div>' +
            '<div style="display:flex;align-items:center;gap:10px;"><span style="width:40px;height:1px;background:#c4943f;"></span><span style="font-family:\'Inter\',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#6b4e1f;">Gemstone Identification Report</span><span style="width:40px;height:1px;background:#c4943f;"></span></div>' +
          '</div>' +
          /* Title */
          '<div style="text-align:center;margin-top:18px;">' +
            '<div style="font-family:\'Fraunces\',serif;font-size:44px;font-weight:600;letter-spacing:-0.012em;color:#1c2b52;">Certificate of Authenticity</div>' +
            '<div style="font-family:\'Inter\',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.26em;text-transform:uppercase;color:#5a6470;margin-top:8px;">Of Gemstone Identification</div>' +
          '</div>' +
          /* Body: data table + right column */
          '<div style="display:flex;gap:32px;margin-top:36px;">' +
            /* Data table */
            '<div id="' + p + 'Fields" style="flex:1.3;display:grid;grid-template-columns:auto 1fr;align-content:start;">' +
            '</div>' +
            /* Right column: image, name, QR, date */
            '<div style="width:208px;flex:none;display:flex;flex-direction:column;align-items:center;">' +
              '<div id="' + p + 'ImageBox" style="width:200px;height:178px;border:none;background:rgba(255,255,255,0.5);position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;overflow:hidden;">' +
                '<svg width="52" height="52" viewBox="0 0 64 64" fill="none" stroke="#1c2b52" stroke-width="1.5" stroke-linejoin="round"><path d="M14 26 L24 13 L40 13 L50 26 L32 53 Z"/><path d="M14 26 L50 26"/><path d="M24 13 L28 26 L32 53"/><path d="M40 13 L36 26 L32 53"/></svg>' +
                '<span style="font-family:\'Inter\',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#5a6470;">Specimen image</span>' +
              '</div>' +
              '<div id="' + p + 'StoneName" style="font-family:\'Fraunces\',serif;font-size:21px;font-weight:600;color:#1c2b52;margin-top:4px;text-align:center;align-self:center;">—</div>' +
              '<div id="' + p + 'QrBox" style="position:relative;width:96px;height:96px;margin-top:14px;"><img id="' + p + 'QrImg" src="" alt="Verification QR" style="width:100%;height:100%;display:block;"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:24px;height:24px;background:#fff;border-radius:4px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px #fff;"><img src="assets/SG_logo.png" alt="" style="width:20px;height:20px;object-fit:contain;"></div></div>' +
              '<div style="font-family:\'Inter\',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#5a6470;margin-top:8px;">Scan to verify</div>' +
              '<div id="' + p + 'IssuedDate" style="font-family:\'IBM Plex Mono\',monospace;font-size:9.5px;color:#5a6470;margin-top:4px;">—</div>' +
            '</div>' +
          '</div>' +
          /* Footer: signature + lab director */
          '<div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;">' +
            '<div>' +
              '<img id="' + p + 'Signature" src="assets/sign_design_v2.png" alt="Lab Director signature" style="width:113px;height:33px;object-fit:cover;display:block;">' +
              '<div style="width:113px;height:1px;background:#1c2b52;margin:7px 0;"></div>' +
              '<div style="font-family:\'Inter\',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#5a6470;text-align:center;">LAB DIRECTOR</div>' +
            '</div>' +
          '</div>' +
          /* Bottom bar */
          '<div style="border-top:1px solid rgba(28,43,82,0.18);margin-top:16px;padding-top:12px;display:flex;justify-content:center;align-items:center;gap:14px;font-family:\'Inter\',sans-serif;font-size:11.5px;color:#5a6470;">' +
            '<span>www.sgtlgemtesting.co.in</span>' +
          '</div>' +
          '<div style="text-align:center;font-family:\'Inter\',sans-serif;font-size:10px;letter-spacing:0.04em;color:#9aa0a6;margin-top:6px;">Computer-generated certificate of authenticity</div>' +
          '<img id="' + p + 'Badge" src="assets/badge_design_v2.png" alt="Authentication badge" style="position:absolute;left:586px;top:920px;width:76px;height:78px;object-fit:cover;">' +
        '</div>' +
      '</div>'
    );
  }

  // ─── Build certificate field list from raw record ───
  function buildFields(r, reportNumberOverride) {
    return [
      { label: "Report No",              val: reportNumberOverride || r["Report No."] || "", mono: true },
      { label: "Specimen Description",   val: r["Stone Name"] || "" },
      { label: "Weight",                 val: r["Weight"] ? r["Weight"] + " " + (r["Weight Type"] || "Ratti") : "", mono: true },
      { label: "Shapes / Cut",           val: [r["Shapes"], r["Cut"]].filter(Boolean).join(" ") || "" },
      { label: "Colour",                 val: r["Colour"] || "" },
      { label: "Clarity",                val: r["Clarity"] || "" },
      { label: "Carat",                  val: r["Carat"] ? (r["Carat"] + " ct") : "" },
      { label: "Refractive Index",       val: r["Refractive Index"] || "", mono: true },
      { label: "Optic Character",        val: r["Optic Character"] || "" },
      { label: "Specific Gravity",       val: r["Specific Gravity"] || "", mono: true },
      { label: "Party Name",             val: r["Party Name"] || r["Jeweller"] || "" },
      { label: "Comments",               val: r["Comment"] || r["Magnification"] || "" }
    ];
  }

  // ─── Render field rows HTML ───
  function renderFieldsHTML(fields) {
    var sep = '<div style="grid-column:1/-1;height:1px;background:rgba(28,43,82,0.22);"></div>';
    var html = sep;
    fields.forEach(function (f) {
      var valStyle =
        "font-family:'IBM Plex Mono',monospace;font-size:13px;color:#1c2b52;padding:7px 4px 7px 0;text-align:right;word-break:break-word;";
      if (f.mono) valStyle += "font-variant-numeric:tabular-nums;";
      html +=
        '<div style="font-family:\'Inter\',sans-serif;font-size:9.5px;font-weight:700;letter-spacing:0.13em;text-transform:uppercase;color:#5a6470;padding:7px 16px 7px 4px;white-space:nowrap;vertical-align:middle;display:flex;align-items:center;">' +
        esc(f.label) +
        "</div>";
      html +=
        '<div data-field="' + esc(f.label) + '" style="' + valStyle + '">' +
        esc(f.val) +
        "</div>";
      html += sep;
    });
    return html;
  }

  // ─── Inject template into container ───
  function injectTemplate(containerId, idPrefix) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = templateHTML(idPrefix || containerId.replace("Tpl", ""));
  }

  // ─── Populate template from certificateData ───
  // data = { record, qrDataUrl, gemImageDataUrl, reportNumber }
  function populate(idPrefix, data) {
    var p = idPrefix;
    var r = data.record || {};

    // Build + render fields
    var fields = buildFields(r, data.reportNumber);
    var fieldsEl = document.getElementById(p + "Fields");
    if (fieldsEl) fieldsEl.innerHTML = renderFieldsHTML(fields);

    // Gemstone image
    var imgBox = document.getElementById(p + "ImageBox");
    if (imgBox) {
      if (data.gemImageDataUrl) {
        imgBox.innerHTML =
          '<img src="' + data.gemImageDataUrl + '" style="width:100%;height:100%;object-fit:cover;">';
      } else {
        imgBox.innerHTML =
          '<svg width="52" height="52" viewBox="0 0 64 64" fill="none" stroke="#1c2b52" stroke-width="1.5" stroke-linejoin="round"><path d="M14 26 L24 13 L40 13 L50 26 L32 53 Z"/><path d="M14 26 L50 26"/><path d="M24 13 L28 26 L32 53"/><path d="M40 13 L36 26 L32 53"/></svg>' +
          '<span style="font-family:\'Inter\',sans-serif;font-size:9px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:#5a6470;">Specimen image</span>';
      }
    }

    // Stone name
    var nameEl = document.getElementById(p + "StoneName");
    if (nameEl) nameEl.textContent = r["Stone Name"] || "Gemstone";

    // QR code
    var qrImg = document.getElementById(p + "QrImg");
    if (qrImg && data.qrDataUrl) qrImg.src = data.qrDataUrl;

    // Issued date
    var dateEl = document.getElementById(p + "IssuedDate");
    if (dateEl) dateEl.textContent = "Issued " + (r["Date"] || "");
  }

  // ─── Public API ───
  return {
    injectTemplate: injectTemplate,
    populate: populate,
    templateHTML: templateHTML,
    buildFields: buildFields,
    renderFieldsHTML: renderFieldsHTML
  };
})();
