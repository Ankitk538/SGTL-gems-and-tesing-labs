// ==========================================
// 1. SUPABASE INITIALIZATION
// ==========================================
const supabaseUrl = 'https://clllfjxkhcozphqxssbb.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbGxmanhraGNvenBocXhzc2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTE4NDA3NjIsImV4cCI6MjAwNzQxNjc2Mn0.z5f0BvX8vXg3n7XW8-7_3f_6X_8vX8vXg3n7XW8-7_3f'; 
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// 2. DOM ELEMENT SELECTORS
// ==========================================
const form = document.querySelector("#verifyForm");
const input = document.querySelector("#reportNumber");
const panel = document.querySelector("#resultPanel");
const queryForm = document.querySelector("#queryForm");
const queryStatus = document.querySelector("#queryStatus");
const tableBody = document.querySelector("#databaseTableBody") || document.querySelector("tbody");

// ==========================================
// 3. ENHANCED DECRYPTION & CASE-INSENSITIVE NULL FILTER
// ==========================================
function decryptField(value) {
  if (value === null || value === undefined) return "";

  const stringVal = String(value).trim();
  const upperVal = stringVal.toUpperCase();

  // Intercepts empty values, the string "EMPTY", and old default dashes
  if (stringVal === "" || upperVal === "EMPTY" || upperVal === "--" || upperVal === "NULL") {
    return "";
  }
  
  // If the string contains an encrypted AES block
  if (stringVal.includes(':')) {
    try {
      return decryptData(stringVal); // Triggers your encryption script utility
    } catch (e) {
      console.error("Decryption failure for value:", stringVal, e);
      return stringVal; 
    }
  }
  return stringVal;
}

// ==========================================
// 4. UI RENDER FUNCTIONS (FOR POPUP WIDGET LOOKUP)
// ==========================================
function renderReport(reportNumber, report) {
  if (!panel) return;
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
  if (!panel) return;
  panel.className = "result-panel invalid";
  panel.innerHTML = `
    <h3>No matching report found</h3>
    <p>We could not find an active record for <strong>${reportNumber || "this report number"}</strong>. Check the number exactly as printed on the certificate or contact the lab.</p>
  `;
}

// ==========================================
// 5. LIVE SEARCH SUBMISSION INTERACTION
// ==========================================
if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const reportNumber = input.value.trim().toUpperCase();

    if (!reportNumber) {
      renderInvalid("");
      return;
    }

    try {
      const { data, error } = await _supabase
        .from('sgtl_database')
        .select('*')
        .eq('Report No.', reportNumber)
        .maybeSingle(); 

      if (error) throw error;

      if (data) {
        const checkedWeight = decryptField(data['Weight']);
        const weightType = decryptField(data['Weight Type']);
        const cleanWeight = checkedWeight
          ? `${checkedWeight} ${weightType || 'Ratti'}`
          : "";

        const comment = decryptField(data['Comment']);
        const decryptedReport = {
          status: "Verified",
          reportType: decryptField(data['Report Type']),
          stone: decryptField(data['Stone Name']),
          shape: decryptField(data['Shapes']),
          weight: cleanWeight,
          color: decryptField(data['Colour']),
          clarity: decryptField(data['Clarity']),
          measurements: decryptField(data['Dimensions']),
          issued: decryptField(data['Date']),
          notes: comment || "No explicit comment recorded."
        };

        renderReport(reportNumber, decryptedReport);
      } else {
        renderInvalid(reportNumber);
      }
    } catch (err) { 
      console.error("Database connection failure:", err);
      alert("An error occurred while fetching information from the verification server.");
    }
  });
}

// ==========================================
// 6. MAIN ADMIN DATABASE GRID TABLE GENERATOR (ALL COLUMNS FIXED)
// ==========================================
function renderTableRows(certificatesList) {
  if (!tableBody) return;
  tableBody.innerHTML = ""; // Clear old layout dashboard records

  certificatesList.forEach(cert => {
    const row = document.createElement('tr');
    
    // Explicitly handles ALL columns matching your admin UI panel headers
    row.innerHTML = `
      <td>${cert['No.'] || ''}</td>
      <td><strong>${cert['Report No.'] || ''}</strong></td>
      <td>${decryptField(cert['Date'])}</td>
      <td>${decryptField(cert['Party Name'])}</td>
      <td>${decryptField(cert['Stone Name'])}</td>
      <td>${decryptField(cert['Report Type'])}</td> 
      <td>${decryptField(cert['Weight'])}</td>
      <td>${decryptField(cert['Weight Type'])}</td>
      <td>${decryptField(cert['Colour'])}</td>
      <td>${decryptField(cert['Shapes'])}</td>      
      <td>${decryptField(cert['Cut'])}</td>
      <td>${decryptField(cert['Dimensions'])}</td>
      <td>${decryptField(cert['Origin'])}</td>
      <td>${decryptField(cert['Mounted / UnMounted'])}</td>
      <td>${decryptField(cert['Specific Gravity'])}</td>
      <td>${decryptField(cert['Refractive Index'])}</td>
      <td>${decryptField(cert['Optic Character'])}</td>
      <td>${decryptField(cert['Magnification'])}</td>
      <td>${decryptField(cert['Comment'])}</td>
      <td>
        <button class="btn-edit" style="padding: 4px 8px; margin-right: 4px;">Edit</button>
        <button class="btn-delete" style="padding: 4px 8px; background: #3a1c1c; color: #ff6b6b; border: 1px solid #5a2c2c;">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// ==========================================
// 7. REAL-TIME DATA INITIALIZATION LOADER
// ==========================================
async function loadAdminDatabaseGrid() {
  try {
    const { data, error } = await _supabase
      .from('sgtl_database')
      .select('*')
      .order('No.', { ascending: false });

    if (error) throw error;
    if (data) {
      renderTableRows(data); 
    }
  } catch (err) {
    console.error("Failed to populate admin workspace grid:", err);
  }
}

// Fire data synchronization routine immediately once the page loads
document.addEventListener("DOMContentLoaded", loadAdminDatabaseGrid);

if (input) {
  input.addEventListener("input", () => {
    input.value = input.value.toUpperCase();
  });
}

if (queryForm) {
  queryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    queryStatus.textContent = "Thank you. Your query has been prepared for SG&TL follow-up.";
    queryForm.reset();
  });
}
// ==========================================
// 8. QUICK ENQUIRY FORM SUBMISSION (SUPABASE)
// ==========================================
if (queryForm) {
  queryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    if (queryStatus) {
      queryStatus.textContent = "Sending enquiry...";
    }

    try {
      // Integrated the Supabase insertion logic mapped to the local _supabase client instance
      const { data, error } = await _supabase
        .from('enquiries')
        .insert([
          { 
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('email').value, 
            phone: document.getElementById('phone').value, 
            message: document.getElementById('message').value 
          }
        ]);

      if (error) throw error;

      if (queryStatus) {
        queryStatus.textContent = "Thank you. Your query has been prepared for SG&TL follow-up.";
      }
      queryForm.reset();

    } catch (err) {
      console.error("Enquiry submission failure:", err);
      if (queryStatus) {
        queryStatus.textContent = "An error occurred while sending your enquiry. Please try again.";
      }
    }
  });
}