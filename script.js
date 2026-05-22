const reports = {
  "SGTL-2026-1048": {
    status: "Verified",
    reportType: "Gemstone Identification Report",
    stone: "Natural Blue Sapphire",
    shape: "Oval Mixed Cut",
    weight: "3.42 ct",
    color: "Royal Blue",
    clarity: "Eye Clean",
    measurements: "9.12 x 7.04 x 5.21 mm",
    issued: "18 Apr 2026",
    notes: "No indications of heat treatment observed."
  },
  "SGTL-2026-2197": {
    status: "Verified",
    reportType: "Gemstone Identification Report",
    stone: "Natural Emerald",
    shape: "Octagonal Step Cut",
    weight: "2.18 ct",
    color: "Vivid Green",
    clarity: "Moderate Natural Inclusions",
    measurements: "8.01 x 6.22 x 4.18 mm",
    issued: "26 Apr 2026",
    notes: "Minor clarity enhancement in fissures."
  },
  "SGTL-2026-3305": {
    status: "Verified",
    reportType: "Gemstone Identification Report",
    stone: "Natural Ruby",
    shape: "Cushion Cut",
    weight: "1.76 ct",
    color: "Pigeon Blood Red",
    clarity: "Slightly Included",
    measurements: "7.02 x 6.44 x 3.88 mm",
    issued: "02 May 2026",
    notes: "Heated; no foreign residue detected."
  }
};

const form = document.querySelector("#verifyForm");
const input = document.querySelector("#reportNumber");
const panel = document.querySelector("#resultPanel");
const queryForm = document.querySelector("#queryForm");
const queryStatus = document.querySelector("#queryStatus");

function renderReport(reportNumber, report) {
  panel.className = "result-panel verified";
  panel.innerHTML = `
    <span class="badge">${report.status}</span>
    <h3>${report.stone}</h3>
    <p>Report <strong>${reportNumber}</strong> matches an active SG&amp;TL laboratory record.</p>
    <div class="report-meta">
      <div><span>Report Type</span><strong>${report.reportType}</strong></div>
      <div><span>Shape</span><strong>${report.shape}</strong></div>
      <div><span>Weight</span><strong>${report.weight}</strong></div>
      <div><span>Color</span><strong>${report.color}</strong></div>
      <div><span>Clarity</span><strong>${report.clarity}</strong></div>
      <div><span>Measurements</span><strong>${report.measurements}</strong></div>
      <div><span>Issued</span><strong>${report.issued}</strong></div>
    </div>
    <p class="form-note">${report.notes}</p>
  `;
}

function renderInvalid(reportNumber) {
  panel.className = "result-panel invalid";
  panel.innerHTML = `
    <h3>No matching report found</h3>
    <p>We could not find an active record for <strong>${reportNumber || "this report number"}</strong>. Check the number exactly as printed on the certificate or contact the lab.</p>
  `;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const reportNumber = input.value.trim().toUpperCase();

  if (!reportNumber) {
    renderInvalid("");
    return;
  }

  const report = reports[reportNumber];
  if (report) {
    renderReport(reportNumber, report);
  } else {
    renderInvalid(reportNumber);
  }
});

input.addEventListener("input", () => {
  input.value = input.value.toUpperCase();
});

queryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  queryStatus.textContent = "Thank you. Your query has been prepared for SG&TL follow-up.";
  queryForm.reset();
});
