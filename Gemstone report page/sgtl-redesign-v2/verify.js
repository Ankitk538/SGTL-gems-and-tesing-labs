// Shared report-verification demo for all three variants.
// ponytail: in-memory sample records; swap lookup() for a fetch() to the real API.
const RECORDS = {
  "SGTL-2024-0817": "Natural Blue Sapphire · 3.42 ct · oval mixed cut · heat treatment detected · origin: Sri Lanka.",
  "SGTL-2023-1190": "Natural Emerald · 1.88 ct · rectangular step cut · minor clarity enhancement (oil).",
  "SGTL-2024-0456": "Natural Ruby · 2.05 ct · cushion cut · no indication of heat · origin: Mozambique."
};

function lookup(raw) {
  const key = (raw || "").trim().toUpperCase();
  if (!key) return { ok: null, msg: "Enter a report number to verify." };
  if (RECORDS[key]) return { ok: true, msg: "Verified — issued by SGTL. " + RECORDS[key] };
  return { ok: false, msg: "No record found for “" + key + "”. Check the number, or contact the laboratory." };
}

const form = document.getElementById("verify-form");
const out = document.getElementById("result");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = lookup(document.getElementById("rep").value);
    out.textContent = r.msg;
    out.style.color = r.ok === true ? "var(--ok, #1a7a4a)" : r.ok === false ? "var(--err, #a12b2b)" : "";
  });
}

// self-check: fails loudly if lookup logic breaks
console.assert(lookup("SGTL-2024-0817").ok === true, "known record should verify");
console.assert(lookup("nope").ok === false, "unknown record should fail");
console.assert(lookup("").ok === null, "empty should prompt");
