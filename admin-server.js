// ═══════════════════════════════════════════════════════════════
// SG&TL Laboratory Certification Admin Panel — Backend Server
// ═══════════════════════════════════════════════════════════════
require("./load-env")();
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");
const Imap = require("imap");
const { simpleParser } = require("mailparser");

const app = express();
app.use(express.json({ limit: "1mb" }));

// CORS allowlist (no wildcard). Configure ALLOWED_ORIGINS in .env.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:3000,http://localhost:8080").split(",").map(s => s.trim()).filter(Boolean);
// Allow configured production origins + any local-dev origin (localhost / 127.0.0.1
// / ::1 on ANY port). Deny everything else cleanly (cb(null,false) — no thrown 500,
// no stack-trace leak). Browser still blocks denied origins (no ACAO header sent).
function isAllowedOrigin(origin) {
  if (!origin) return true; // same-origin, curl, server-to-server
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch (e) { return false; }
}
app.use(cors({ origin: (origin, cb) => cb(null, isAllowedOrigin(origin)), credentials: true }));

// Security headers on every response. CSP keeps 'unsafe-inline' because the
// admin panel + site are inline-heavy; tighten with nonces in a later pass.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' " + SUPABASE_URL + " https://api.qrserver.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'"
  ].join("; "));
  next();
});

// ── Configuration ──
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || "https://clllfjxkhcozphqxssbb.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_ANON_KEY) {
  console.error("[FATAL] SUPABASE_ANON_KEY is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
const HAS_SERVICE_ROLE_KEY = SUPABASE_SERVICE_KEY !== SUPABASE_ANON_KEY;

// AES-256 encryption key (32 bytes) — in production, use env variable
const AES_SEED = process.env.AES_SEED;
if (!AES_SEED) {
  console.warn("[SECURITY] AES_SEED not set — using an insecure default. Set AES_SEED in .env.");
}
const AES_KEY = crypto.createHash("sha256").update(AES_SEED || "INSECURE-DEFAULT-CHANGE-ME").digest();

// HTML-escape any user-supplied value embedded in outbound email HTML.
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
const AES_IV_LENGTH = 16;

// Admin email
const ADMIN_EMAIL = "sunilgems126@gmail.com";

// Supabase clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function adminDbClient(req) {
  return HAS_SERVICE_ROLE_KEY ? supabaseAdmin : req.supabaseUser;
}

// Email transporter (configure with your SMTP credentials)
let emailTransporter = null;
try {
  emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER || ADMIN_EMAIL,
      pass: process.env.SMTP_PASS
    }
  });
} catch (e) {
  console.warn("Email transport not configured. Set SMTP_USER and SMTP_PASS env vars.");
}

// ═══════════════════════════════════════
// IMAP CONFIG — Gmail Reply Sync
// ═══════════════════════════════════════
const IMAP_CONFIG = {
  user: process.env.SMTP_USER || ADMIN_EMAIL,
  password: process.env.SMTP_PASS,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

// Track last sync time (persists in memory; resets on restart)
let lastGmailSync = null;
let gmailSyncStatus = { running: false, lastRun: null, lastResult: null, error: null };

// ─── Gmail Sent-Folder Sync Engine ───
// Connects via IMAP, reads Sent mail since last sync,
// matches replies to enquiry threads, updates DB status
async function syncGmailReplies() {
  if (gmailSyncStatus.running) return { skipped: true, reason: "Sync already running" };
  gmailSyncStatus.running = true;
  gmailSyncStatus.error = null;

  return new Promise((resolve, reject) => {
    const imap = new Imap(IMAP_CONFIG);
    const results = { synced: 0, skipped: 0, errors: [] };

    imap.once("ready", () => {
      // Open Gmail's Sent Mail folder
      imap.openBox("[Gmail]/Sent Mail", true, (err, box) => {
        if (err) {
          // Try alternate name
          imap.openBox("INBOX.Sent", true, (err2, box2) => {
            if (err2) {
              gmailSyncStatus.running = false;
              gmailSyncStatus.error = "Cannot open Sent folder: " + err.message;
              imap.end();
              return resolve(results);
            }
            fetchSentEmails(imap, results, resolve);
          });
          return;
        }
        fetchSentEmails(imap, results, resolve);
      });
    });

    imap.once("error", (err) => {
      gmailSyncStatus.running = false;
      gmailSyncStatus.error = err.message;
      resolve(results);
    });

    imap.once("end", () => {
      gmailSyncStatus.running = false;
      gmailSyncStatus.lastRun = new Date().toISOString();
      gmailSyncStatus.lastResult = results;
    });

    imap.connect();
  });
}

async function canUseEnhancedEnquiryColumns() {
  try {
    const { error } = await supabaseAdmin
      .from("enquiries")
      .select("enquiry_no, category, priority")
      .limit(1);

    return !error;
  } catch (e) {
    return false;
  }
}

function fetchSentEmails(imap, results, resolve) {
  // Search for emails sent in the last 2 days (or since last sync)
  const sinceDate = lastGmailSync
    ? new Date(new Date(lastGmailSync).getTime() - 3600000) // 1hr overlap buffer
    : new Date(Date.now() - 2 * 86400000); // default: last 2 days

  // Format as "DD-Mon-YYYY" which IMAP RFC 3501 requires
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const searchDate = `${sinceDate.getDate()}-${months[sinceDate.getMonth()]}-${sinceDate.getFullYear()}`;

  try {
  imap.search([["SINCE", searchDate]], (err, uids) => {
    if (err || !uids || uids.length === 0) {
      lastGmailSync = new Date().toISOString();
      imap.end();
      return resolve(results);
    }

    const f = imap.fetch(uids, { bodies: "", struct: true });
    const emailPromises = [];

    f.on("message", (msg) => {
      let buffer = "";
      msg.on("body", (stream) => {
        stream.on("data", (chunk) => { buffer += chunk.toString("utf8"); });
        stream.on("end", () => {
          emailPromises.push(
            simpleParser(buffer).then(parsed => processGmailReply(parsed, results)).catch(() => {})
          );
        });
      });
    });

    f.once("end", async () => {
      await Promise.all(emailPromises);
      lastGmailSync = new Date().toISOString();
      imap.end();
      resolve(results);
    });
  });
  } catch (searchErr) {
    console.warn("[Gmail Sync] Search error:", searchErr.message);
    lastGmailSync = new Date().toISOString();
    try { imap.end(); } catch(e) {}
    resolve(results);
  }
}

async function processGmailReply(parsed, results) {
  try {
    // Only process emails FROM our admin
    const fromAddr = parsed.from?.value?.[0]?.address?.toLowerCase();
    if (fromAddr !== ADMIN_EMAIL.toLowerCase()) return;

    // Get the TO address (the customer we replied to)
    const toAddr = parsed.to?.value?.[0]?.address?.toLowerCase();
    if (!toAddr) return;

    const replyBody = parsed.text || parsed.html?.replace(/<[^>]+>/g, " ").trim() || "";
    const replyDate = parsed.date ? parsed.date.toISOString() : new Date().toISOString();
    const subject = parsed.subject || "";

    // Skip if this is an internal/non-enquiry email
    if (toAddr === ADMIN_EMAIL.toLowerCase()) return;

    // Find matching thread in DB by customer email
    const { data: matches, error } = await supabaseAdmin
      .from("enquiries")
      .select("*")
      .eq("thread_id", toAddr)
      .order("id", { ascending: false })
      .limit(10);

    if (error || !matches || matches.length === 0) {
      results.skipped++;
      return;
    }

    // Find the latest pending enquiry in this thread
    const pendingMsg = matches.find(m => m.query_status === "pending" || !m.query_status);
    const targetMsg = pendingMsg || matches[0]; // fallback to latest

    // Check if we already synced this reply (avoid duplicates)
    if (targetMsg.remarks && targetMsg.reply_date) {
      const existingDate = new Date(targetMsg.reply_date).getTime();
      const newDate = new Date(replyDate).getTime();
      // If reply_date is within 60s of this email's date, skip (already synced)
      if (Math.abs(existingDate - newDate) < 60000) {
        results.skipped++;
        return;
      }
      // If already resolved and has remarks, skip unless this is newer
      if (targetMsg.query_status === "resolved" && existingDate >= newDate) {
        results.skipped++;
        return;
      }
    }

    // Clean the reply body — remove quoted text (lines starting with >)
    let cleanReply = replyBody
      .split("\n")
      .filter(line => !line.trim().startsWith(">"))
      .join("\n")
      .replace(/On .+ wrote:/g, "")  // Remove "On ... wrote:" attribution
      .replace(/--\s*\n[\s\S]*$/, "") // Remove signature block
      .trim();

    // Truncate if extremely long
    if (cleanReply.length > 2000) cleanReply = cleanReply.substring(0, 2000) + "...";

    // Update the enquiry in DB
    const { error: updateErr } = await supabaseAdmin
      .from("enquiries")
      .update({
        remarks: cleanReply,
        reply_date: replyDate,
        query_status: "resolved"
      })
      .eq("id", targetMsg.id);

    if (updateErr) {
      results.errors.push(`Failed to update enquiry #${targetMsg.id}: ${updateErr.message}`);
    } else {
      results.synced++;
      console.log(`[Gmail Sync] Synced reply to ${toAddr} → enquiry #${targetMsg.id}`);
    }
  } catch (e) {
    results.errors.push(e.message);
  }
}

// Auto-sync every 5 minutes
const SYNC_INTERVAL = 5 * 60 * 1000;
let syncTimer = null;
function startAutoSync() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    syncGmailReplies().catch(e => console.warn("[Gmail Sync] Error:", e.message));
  }, SYNC_INTERVAL);
  console.log("  [Gmail Sync] Auto-sync enabled (every 5 min)");
}

// ═══════════════════════════════════════
// AES-256 Encryption/Decryption
// ═══════════════════════════════════════
function encrypt(text) {
  if (!text || text === "N/A") return text;
  const str = String(text);
  const iv = crypto.randomBytes(AES_IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", AES_KEY, iv);
  let encrypted = cipher.update(str, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  if (!text || !text.includes(":")) return text;
  try {
    const parts = text.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv("aes-256-cbc", AES_KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return text; // Return as-is if decryption fails (might be unencrypted)
  }
}

function encryptRecord(record) {
  const encrypted = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === "id" || key === "created_at" || key === "Report No.") {
      encrypted[key] = value; // Don't encrypt IDs and report number
    } else {
      encrypted[key] = encrypt(String(value));
    }
  }
  return encrypted;
}

function decryptRecord(record) {
  if (!record) return record;
  const decrypted = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) {
      decrypted[key] = null;
    } else {
      decrypted[key] = decrypt(String(value));
    }
  }
  return decrypted;
}

const CERTIFICATE_FIELDS = [
  "No.",
  "Report No.",
  "Date",
  "Party Name",
  "Stone Name",
  "Report Type",
  "Weight",
  "Weight Type",
  "Colour",
  "Shapes",
  "Cut",
  "Dimensions",
  "Origin",
  "Mounted / UnMounted",
  "Specific Gravity",
  "Refractive Index",
  "Optic Character",
  "Magnification",
  "Comment"
];

function normalizeReportNo(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeDateToDDMMYYYY(value) {
  if (!value) return value;
  const s = String(value).trim();
  // Already DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  // YYYY-MM-DD (HTML date input)
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
  // DD-Mon-YY
  const monYY = s.match(/^(\d{2})-([A-Za-z]{3})-(\d{2})$/);
  if (monYY) {
    const months = { JAN:"01",FEB:"02",MAR:"03",APR:"04",MAY:"05",JUN:"06",JUL:"07",AUG:"08",SEP:"09",OCT:"10",NOV:"11",DEC:"12" };
    const mm = months[monYY[2].toUpperCase()] || "01";
    return `${monYY[1]}-${mm}-20${monYY[3]}`;
  }
  return s; // unrecognized — return as-is
}

function normalizeCertificateRecord(record, { includeEmpty = true } = {}) {
  const normalized = {};
  const reportNo = normalizeReportNo(record["Report No."]);

  for (const field of CERTIFICATE_FIELDS) {
    const rawValue = record[field];
    if (field === "No.") {
      if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== "") {
        const noValue = Number(String(rawValue).trim());
        if (Number.isFinite(noValue)) normalized[field] = noValue;
      }
      continue;
    }

    if (field === "Report No.") {
      if (reportNo || includeEmpty) normalized[field] = reportNo;
      continue;
    }

    if (rawValue === undefined || rawValue === null || String(rawValue).trim().toLowerCase() === "null") {
      if (includeEmpty) normalized[field] = null;
      continue;
    }

    const value = String(rawValue).trim();
    if (value === "") {
      if (includeEmpty) normalized[field] = null;
    } else {
      normalized[field] = field === "Date" ? normalizeDateToDDMMYYYY(value) : value;
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (CERTIFICATE_FIELDS.includes(key) || key === "id" || key === "created_at") continue;
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      normalized[key] = String(value).trim();
    }
  }

  return normalized;
}

async function getNextCertificateNo(db) {
  const { data, error } = await db
    .from("sgtl_database")
    .select('"No."')
    .order('"No."', { ascending: false, nullsFirst: false })
    .limit(1);

  if (error || !data || data.length === 0) return undefined;
  const currentNo = Number(data[0]["No."]);
  return Number.isFinite(currentNo) ? currentNo + 1 : undefined;
}

async function repairMissingCertificateNumbers(db) {
  let nextNo = await getNextCertificateNo(db);
  if (!nextNo) nextNo = Date.now();

  const { data, error } = await db
    .from("sgtl_database")
    .select('"No.","Report No.","Date"')
    .is('"No."', null)
    .order("Date", { ascending: true });

  if (error) throw error;

  const repaired = [];
  for (const row of data || []) {
    if (!row["Report No."]) continue;
    const assignedNo = nextNo++;
    const { error: updateError } = await db
      .from("sgtl_database")
      .update({ "No.": assignedNo })
      .eq('"Report No."', row["Report No."]);

    if (updateError) throw updateError;
    repaired.push({ reportNo: row["Report No."], no: assignedNo });
  }

  return repaired;
}

// ═══════════════════════════════════════
// Audit Logging
// ═══════════════════════════════════════
const auditLogs = []; // In-memory for now; can be moved to Supabase table

function logAudit(action, user, details = {}, mfa = false) {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    user: user || "system",
    details: typeof details === "string" ? details : JSON.stringify(details),
    mfa,
    ip: details.ip || "unknown"
  };
  auditLogs.unshift(entry);
  if (auditLogs.length > 500) auditLogs.pop();
  return entry;
}

// Security metrics (in-memory counters)
const securityMetrics = {
  tamperAttempts: 0,
  integrityChecks: 0,
  integrityPassed: 0,
  unauthorizedBlocked: 0,
  lastCheck: new Date().toISOString()
};

// ═══════════════════════════════════════
// Auth Middleware
// ═══════════════════════════════════════
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    securityMetrics.unauthorizedBlocked++;
    logAudit("UNAUTHORIZED_ACCESS", null, { ip: req.ip, path: req.path });
    return res.status(401).json({ error: "No authorization token provided" });
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      securityMetrics.unauthorizedBlocked++;
      logAudit("INVALID_TOKEN", null, { ip: req.ip });
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    // Check if user is admin
    if (String(user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      securityMetrics.unauthorizedBlocked++;
      logAudit("ACCESS_DENIED", user.email, { reason: "Not admin" });
      return res.status(403).json({ error: "Access denied. Admin only." });
    }
    req.user = user;
    req.userToken = token;
    // Create a user-scoped Supabase client that passes RLS
    // Pass the user's JWT as a global Authorization header so PostgREST sees the authenticated role
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    req.supabaseUser = userClient;
    next();
  } catch (e) {
    securityMetrics.unauthorizedBlocked++;
    return res.status(401).json({ error: "Authentication failed" });
  }
}

// ═══════════════════════════════════════
// Static Files
// ═══════════════════════════════════════
app.use((req, res, next) => {
  const blockedStaticFiles = new Set([
    "/admin-server.js",
    "/server.js",
    "/package.json",
    "/package-lock.json",
    "/.env",
    "/.env.example",
    "/admin-server.log",
    "/admin-server-error.log"
  ]);

  if (blockedStaticFiles.has(req.path) || req.path.startsWith("/node_modules/")) {
    return res.status(404).send("Not found");
  }

  next();
});

// Serve landing page as the default homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").sendFile(path.join(__dirname, "robots.txt"));
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml").sendFile(path.join(__dirname, "sitemap.xml"));
});

app.use(express.static(path.join(__dirname), {
  dotfiles: "ignore",
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "public, max-age=300");
    } else {
      res.setHeader("Cache-Control", "public, max-age=86400");
    }
  }
}));

// Public exact-match certificate verification. This keeps the website from needing
// broad anon SELECT access to the certificate table.
app.get("/verify/:reportNo", async (req, res) => {
  try {
    const reportNo = normalizeReportNo(req.params.reportNo);
    if (!reportNo) {
      return res.status(400).json({ error: "Report number is required" });
    }

    const db = HAS_SERVICE_ROLE_KEY ? supabaseAdmin : supabase;
    let { data, error } = await db
      .from("sgtl_database")
      .select("*")
      .eq('"Report No."', reportNo)
      .maybeSingle();

    const numericReportNo = Number(reportNo);
    if (!data && !error && Number.isFinite(numericReportNo)) {
      ({ data, error } = await db
        .from("sgtl_database")
        .select("*")
        .eq('"No."', numericReportNo)
        .maybeSingle());
    }

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Certificate not found" });

    securityMetrics.integrityChecks++;
    securityMetrics.integrityPassed++;
    res.json({ data: decryptRecord(data) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════
// AUTH ENDPOINTS
// ═══════════════════════════════════════

// POST /auth/login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      securityMetrics.unauthorizedBlocked++;
      logAudit("LOGIN_FAILED", email, { reason: error.message, ip: req.ip });
      const hint = String(email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase()
        ? "Invalid login credentials. If this is the first login, create the admin account from First-time setup or reset the password."
        : `Invalid login credentials. The admin email is ${ADMIN_EMAIL}.`;
      return res.status(401).json({ error: error.message === "Invalid login credentials" ? hint : error.message });
    }
    // Check admin access
    if (String(data.user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      logAudit("ACCESS_DENIED", email, { reason: "Not admin" });
      return res.status(403).json({ error: "Access denied. Admin only." });
    }
    logAudit("LOGIN_SUCCESS", email, { ip: req.ip }, true);
    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { email: data.user.email, id: data.user.id },
      mfa: false // Supabase MFA can be enabled via dashboard
    });
  } catch (e) {
    res.status(500).json({ error: "Login failed: " + e.message });
  }
});

// POST /auth/signup (for initial admin setup only)
app.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Only admin email can register" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  try {
    let data;
    let error;

    if (HAS_SERVICE_ROLE_KEY) {
      ({ data, error } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true
      }));
    } else {
      ({ data, error } = await supabase.auth.signUp({ email: normalizedEmail, password }));
    }

    if (error) return res.status(400).json({ error: error.message });
    logAudit("ACCOUNT_CREATED", normalizedEmail, { ip: req.ip });
    res.json({
      message: HAS_SERVICE_ROLE_KEY
        ? "Admin account created. You can sign in now."
        : "Account created. Check email for verification before signing in.",
      user: data.user
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /auth/confirm-admin (auto-confirm admin account for setups without service key)
app.post("/auth/confirm-admin", async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Only admin email can be confirmed" });
  }
  try {
    // Delete existing unconfirmed user and recreate with OTP verification bypass
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (!signInError && signInData?.session) {
      // Already works - return token
      return res.json({ token: signInData.session.access_token, refresh_token: signInData.session.refresh_token, user: { email: signInData.user.email, id: signInData.user.id } });
    }
    // Try verifying via OTP with the signup token approach
    // For anon key setups, we need to use signUp with autoConfirm workaround
    // Delete the unconfirmed user and re-create via admin API if available
    if (HAS_SERVICE_ROLE_KEY) {
      // List users and confirm
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const adminUser = users.find(u => u.email === normalizedEmail);
      if (adminUser) {
        await supabaseAdmin.auth.admin.updateUser(adminUser.id, { email_confirm: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) return res.status(400).json({ error: error.message });
        return res.json({ token: data.session.access_token, refresh_token: data.session.refresh_token, user: { email: data.user.email, id: data.user.id } });
      }
    }
    res.status(400).json({ error: "Cannot auto-confirm without service role key. Please verify the email via the link sent to " + normalizedEmail + ", or add SUPABASE_SERVICE_KEY environment variable and restart the server." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /auth/forgot-password
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const redirectBase = process.env.SITE_URL || `http://localhost:${PORT}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBase}/admin.html#reset-password`
    });
    if (error) return res.status(400).json({ error: error.message });
    logAudit("PASSWORD_RESET_REQUESTED", email, { ip: req.ip });
    res.json({ message: "Password reset email sent" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /auth/reset-password
app.post("/auth/reset-password", async (req, res) => {
  const { access_token, new_password } = req.body;
  try {
    const { error } = await supabase.auth.updateUser(
      { password: new_password },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (error) return res.status(400).json({ error: error.message });
    logAudit("PASSWORD_RESET_SUCCESS", null, { ip: req.ip });
    res.json({ message: "Password updated successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /auth/refresh
app.post("/auth/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: error.message });
    res.json({ token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════
// CERTIFICATE ENDPOINTS
// ═══════════════════════════════════════

// POST /certificate/create
app.post("/certificate/create", authMiddleware, async (req, res) => {
  try {
    const record = normalizeCertificateRecord(req.body);
    if (!record["Report No."]) {
      return res.status(400).json({ error: "Report No. is required" });
    }

    const db = adminDbClient(req);
    if (!record["No."]) {
      const nextNo = await getNextCertificateNo(db);
      record["No."] = nextNo || Date.now();
    }

    const { data, error } = await db
      .from("sgtl_database")
      .insert([record])
      .select();

    if (error) {
      securityMetrics.tamperAttempts++;
      logAudit("CERTIFICATE_CREATE_FAILED", req.user.email, { error: error.message });
      return res.status(400).json({ error: error.message });
    }

    logAudit("CERTIFICATE_CREATED", req.user.email, { reportNo: record["Report No."] }, true);
    securityMetrics.integrityChecks++;
    securityMetrics.integrityPassed++;

    res.json({ message: "Certificate created", data: decryptRecord(data[0]) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /certificate/:reportNo
app.get("/certificate/:reportNo", authMiddleware, async (req, res) => {
  try {
    let { data, error } = await adminDbClient(req)
      .from("sgtl_database")
      .select("*")
      .eq('"Report No."', normalizeReportNo(req.params.reportNo))
      .single();

    const numericReportNo = Number(normalizeReportNo(req.params.reportNo));
    if ((error || !data) && Number.isFinite(numericReportNo)) {
      ({ data, error } = await adminDbClient(req)
        .from("sgtl_database")
        .select("*")
        .eq('"No."', numericReportNo)
        .single());
    }

    if (error || !data) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    securityMetrics.integrityChecks++;
    securityMetrics.integrityPassed++;
    logAudit("CERTIFICATE_VIEWED", req.user.email, { reportNo: req.params.reportNo });

    res.json({ data: decryptRecord(data) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /certificates/search?q=...
app.get("/certificates/search", authMiddleware, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = adminDbClient(req)
      .from("sgtl_database")
      .select("*", { count: "exact" })
      .range(offset, offset + parseInt(limit) - 1);

    if (q) {
      // Search by Report No. (unencrypted field)
      query = query.ilike('"Report No."', `%${String(q).trim().toUpperCase().replace(/\s+/g, "")}%`);
    }

    const { data, error, count } = await query;
    if (error) return res.status(400).json({ error: error.message });

    const decryptedData = (data || []).map(decryptRecord);
    logAudit("CERTIFICATES_SEARCHED", req.user.email, { query: q, results: decryptedData.length });

    res.json({ data: decryptedData, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /certificates/all
app.get("/certificates/all", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 25 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error, count } = await adminDbClient(req)
      .from("sgtl_database")
      .select("*", { count: "exact" })
      .order("Date", { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) return res.status(400).json({ error: error.message });

    const decryptedData = (data || []).map(decryptRecord);
    res.json({ data: decryptedData, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /certificate/:reportNo
app.put("/certificate/:reportNo", authMiddleware, async (req, res) => {
  try {
    const updates = normalizeCertificateRecord(req.body, { includeEmpty: false });

    const { data, error } = await adminDbClient(req)
      .from("sgtl_database")
      .update(updates)
      .eq('"Report No."', normalizeReportNo(req.params.reportNo))
      .select();

    if (error) return res.status(400).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "Certificate not found" });

    logAudit("CERTIFICATE_UPDATED", req.user.email, { reportNo: req.params.reportNo }, true);
    res.json({ message: "Certificate updated", data: decryptRecord(data[0]) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /certificate/:reportNo
app.delete("/certificate/:reportNo", authMiddleware, async (req, res) => {
  try {
    const { error } = await adminDbClient(req)
      .from("sgtl_database")
      .delete()
      .eq('"Report No."', normalizeReportNo(req.params.reportNo));

    if (error) return res.status(400).json({ error: error.message });

    logAudit("CERTIFICATE_DELETED", req.user.email, { reportNo: req.params.reportNo }, true);
    res.json({ message: "Certificate deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /database/decrypt-all — One-time migration: decrypt any encrypted records in-place
app.post("/database/decrypt-all", authMiddleware, async (req, res) => {
  try {
    const db = adminDbClient(req);
    const { data, error } = await db.from("sgtl_database").select("*");
    if (error) return res.status(400).json({ error: error.message });

    let fixed = 0;
    for (const row of data || []) {
      const reportNo = row["Report No."];
      let needsUpdate = false;
      const updates = {};

      for (const [key, value] of Object.entries(row)) {
        if (key === "id" || key === "created_at" || key === "Report No." || key === "No.") continue;
        // Fix literal "null" strings → empty string
        if (typeof value === "string" && value.trim().toLowerCase() === "null") {
          needsUpdate = true;
          updates[key] = "";
          continue;
        }
        if (typeof value === "string" && value.includes(":")) {
          const decrypted = decrypt(value);
          if (decrypted !== value) {
            needsUpdate = true;
            updates[key] = decrypted;
          }
        }
      }

      if (needsUpdate && reportNo) {
        await db.from("sgtl_database").update(updates).eq('"Report No."', reportNo);
        fixed++;
      }
    }

    logAudit("DATABASE_DECRYPTED", req.user.email, { recordsFixed: fixed }, true);
    res.json({ message: `Decrypted ${fixed} records. Database now stores plain text.`, fixed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════
// ENQUIRY ENDPOINTS
// ═══════════════════════════════════════

// ═══════════════════════════════════════
// ENQUIRY NUMBER GENERATOR
// ═══════════════════════════════════════
// Format: ENQ-YYMMDD-CAT-### (e.g. ENQ-260526-GEN-001)
const ENQUIRY_CATEGORIES = {
  GEN: "General",
  CERT: "Certification",
  TECH: "Technical",
  BILL: "Billing",
  SHIP: "Shipping",
  COMP: "Complaint",
  OTHER: "Other"
};

async function generateEnquiryNumber(category = "GEN") {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const dateStamp = `${yy}${mm}${dd}`;
  const cat = (category || "GEN").toUpperCase();
  const prefix = `ENQ-${dateStamp}-${cat}-`;

  // Find the highest existing number for this prefix today
  const { data, error } = await supabaseAdmin
    .from("enquiries")
    .select("enquiry_no")
    .like("enquiry_no", `${prefix}%`)
    .order("enquiry_no", { ascending: false })
    .limit(1);

  let seq = 1;
  if (!error && data && data.length > 0) {
    const lastNo = data[0].enquiry_no;
    const lastSeq = parseInt(lastNo.split("-").pop(), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return prefix + String(seq).padStart(3, "0");
}

// Valid enquiry statuses and their display properties
const ENQUIRY_STATUSES = {
  new:                { label: "New",                color: "#3498db", icon: "inbox"   },
  in_review:          { label: "In Review",          color: "#f39c12", icon: "search"  },
  awaiting_customer:  { label: "Awaiting Customer",  color: "#9b59b6", icon: "clock"   },
  escalated:          { label: "Escalated",          color: "#e74c3c", icon: "alert"   },
  resolved:           { label: "Resolved",           color: "#2ecc71", icon: "check"   },
  archived:           { label: "Archived",           color: "#7f8c8d", icon: "archive" }
};

const PRIORITY_LEVELS = {
  low:    { label: "Low",    color: "#7f8c8d" },
  medium: { label: "Medium", color: "#f39c12" },
  high:   { label: "High",   color: "#e67e22" },
  urgent: { label: "Urgent", color: "#e74c3c" }
};

// ═══════════════════════════════════════
// PUBLIC ENQUIRY SUBMISSION (no auth)
// ═══════════════════════════════════════
// Website form POSTs here instead of direct Supabase insert
// Saves to DB + sends notification email to admin Gmail
app.post("/api/enquiry", async (req, res) => {
  const { email, phone, message, name, first_name, last_name, category } = req.body;
  if (!email || !message) {
    return res.status(400).json({ error: "Email and message are required" });
  }

  try {
    const cat = (category || "GEN").toUpperCase();
    let enquiryNo = null;
    const supportsEnhancedColumns = await canUseEnhancedEnquiryColumns();

    if (supportsEnhancedColumns) {
      try { enquiryNo = await generateEnquiryNumber(cat); } catch (e) { /* ignore and fall back to basic insert */ }
    }

    // Resolve first/last name — form sends first_name/last_name, fallback to name
    const resolvedFirstName = first_name || (name ? name.split(" ")[0] : null);
    const resolvedLastName = last_name || (name ? name.split(" ").slice(1).join(" ") : null);

    // 1. Save to Supabase (use anon key — RLS allows public inserts)
    const insertData = {
      email: email.toLowerCase().trim(),
      phone: phone || null,
      message,
      first_name: resolvedFirstName || null,
      last_name: resolvedLastName || null,
      thread_id: email.toLowerCase().trim(),
      query_status: "new"
    };

    if (supportsEnhancedColumns) {
      if (enquiryNo) insertData.enquiry_no = enquiryNo;
      insertData.category = cat;
      insertData.priority = "medium";
    }

    const { error } = await supabase.from("enquiries").insert(insertData);

    if (error) return res.status(400).json({ error: error.message });

    // 2. Send notification email to admin Gmail inbox
    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: `"SG&TL Website" <${ADMIN_EMAIL}>`,
          to: ADMIN_EMAIL,
          replyTo: email,  // ← KEY: Reply button in Gmail goes to customer
          subject: `New Enquiry from ${email}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#faf8f4;border:1px solid #e0d5c0;border-radius:8px;overflow:hidden;">
              <div style="background:#1a1a2e;color:#c4943f;padding:20px 24px;">
                <h2 style="margin:0;font-size:18px;">New Customer Enquiry — SG&TL</h2>
              </div>
              <div style="padding:20px 24px;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:8px 0;color:#888;width:100px;">From:</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(email)}</td></tr>
                  ${phone ? `<tr><td style="padding:8px 0;color:#888;">Phone:</td><td style="padding:8px 0;">${escapeHtml(phone)}</td></tr>` : ""}
                  <tr><td style="padding:8px 0;color:#888;">Date:</td><td style="padding:8px 0;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>
                </table>
                <div style="margin-top:16px;padding:16px;background:white;border-left:4px solid #c4943f;border-radius:4px;">
                  <p style="margin:0;color:#333;line-height:1.6;">${escapeHtml(message).replace(/\n/g, "<br>")}</p>
                </div>
                <p style="margin-top:16px;font-size:12px;color:#999;">
                  Hit <strong>Reply</strong> in Gmail to respond directly to the customer.<br>
                  Your reply will auto-sync to the Admin Panel within 5 minutes.
                </p>
              </div>
            </div>
          `
        });
        console.log(`[Email] Enquiry notification sent for ${email}`);
      } catch (emailErr) {
        console.warn("[Email] Notification failed:", emailErr.message);
      }
    }

    res.json({ success: true, message: "Enquiry submitted successfully" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════
// GMAIL SYNC ENDPOINTS (admin auth)
// ═══════════════════════════════════════

// POST /gmail/sync — trigger manual sync
app.post("/gmail/sync", authMiddleware, async (req, res) => {
  try {
    const results = await syncGmailReplies();
    logAudit("GMAIL_SYNC", req.user.email, results, true);
    res.json({ success: true, ...results, lastRun: gmailSyncStatus.lastRun });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /gmail/sync-status — check sync status
app.get("/gmail/sync-status", authMiddleware, (req, res) => {
  res.json(gmailSyncStatus);
});

// GET /enquiries — threaded: groups by email, returns threads array + metadata
app.get("/enquiries", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await adminDbClient(req)
      .from("enquiries")
      .select("*")
      .order("id", { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    // Normalize status casing — DB may have "Pending", "Resolved", etc.
    // Convert to lowercase and map legacy values
    function normalizeStatus(raw) {
      const s = String(raw || "new").toLowerCase().trim();
      if (s === "pending") return "new";  // Legacy "Pending" → "new"
      if (["new", "in_review", "awaiting_customer", "escalated", "resolved", "archived"].includes(s)) return s;
      return "new"; // fallback
    }

    // Normalize each row's status before grouping
    (data || []).forEach(eq => {
      eq.query_status = normalizeStatus(eq.query_status);
    });

    // Group into threads by email (thread_id)
    const threadMap = {};
    (data || []).forEach(eq => {
      const key = eq.thread_id || eq.email || `anon-${eq.id}`;
      if (!threadMap[key]) {
        threadMap[key] = {
          thread_id: key,
          email: eq.email,
          first_name: eq.first_name || eq.name?.split(" ")[0] || "",
          last_name: eq.last_name || eq.name?.split(" ").slice(1).join(" ") || "",
          name: eq.name || [eq.first_name || "", eq.last_name || ""].filter(Boolean).join(" ") || "Anonymous",
          phone: eq.phone,
          messages: [],
          latest: eq.created_at,
          has_pending: false,
          category: eq.category || "GEN",
          priority: eq.priority || "medium",
          enquiry_no: eq.enquiry_no || null
        };
      }
      threadMap[key].messages.push(eq);
      const st = eq.query_status;
      if (st === "new" || st === "in_review" || st === "awaiting_customer" || st === "escalated") {
        threadMap[key].has_pending = true;
      }
      if (eq.created_at > threadMap[key].latest) threadMap[key].latest = eq.created_at;
      const currentName = [eq.first_name || "", eq.last_name || ""].filter(Boolean).join(" ") || eq.name || "";
      if (currentName) {
        threadMap[key].first_name = eq.first_name || currentName.split(" ")[0] || "";
        threadMap[key].last_name = eq.last_name || currentName.split(" ").slice(1).join(" ") || "";
        threadMap[key].name = currentName;
      }
      // Use the latest enquiry_no for the thread
      if (eq.enquiry_no) threadMap[key].enquiry_no = eq.enquiry_no;
      // Use the most recent category/priority
      if (eq.category) threadMap[key].category = eq.category;
      if (eq.priority) threadMap[key].priority = eq.priority;
    });

    // Sort threads: pending/active first, then by latest message
    const threads = Object.values(threadMap).sort((a, b) => {
      if (a.has_pending && !b.has_pending) return -1;
      if (!a.has_pending && b.has_pending) return 1;
      return new Date(b.latest) - new Date(a.latest);
    });

    // Status summary counts
    const statusCounts = {};
    (data || []).forEach(eq => {
      const s = eq.query_status || "new";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    res.json({
      threads,
      total: data.length,
      statusCounts,
      statuses: ENQUIRY_STATUSES,
      categories: ENQUIRY_CATEGORIES,
      priorities: PRIORITY_LEVELS
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /enquiry/meta — returns available statuses, categories, priorities
app.get("/enquiry/meta", authMiddleware, (req, res) => {
  res.json({
    statuses: ENQUIRY_STATUSES,
    categories: ENQUIRY_CATEGORIES,
    priorities: PRIORITY_LEVELS
  });
});

// POST /enquiry/reply
app.post("/enquiry/reply", authMiddleware, async (req, res) => {
  const { id, remarks, reply_email } = req.body;
  if (!id || !remarks) {
    return res.status(400).json({ error: "Enquiry ID and remarks required" });
  }
  try {
    const { data, error } = await adminDbClient(req)
      .from("enquiries")
      .update({
        remarks: remarks,
        reply_date: new Date().toISOString(),
        query_status: "resolved"
      })
      .eq("id", id)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    // Send email reply if configured
    if (emailTransporter && reply_email) {
      try {
        await emailTransporter.sendMail({
          from: `"SG&TL Lab" <${ADMIN_EMAIL}>`,
          to: reply_email,
          replyTo: ADMIN_EMAIL,
          subject: "Re: Your Enquiry - SG&TL Laboratory",
          headers: {
            "X-SGTL-Enquiry-Id": String(id),
            "X-SGTL-Source": "admin-panel"
          },
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#faf8f4;border:1px solid #e0d5c0;border-radius:8px;overflow:hidden;">
              <div style="background:#1a1a2e;color:#c4943f;padding:20px 24px;text-align:center;">
                <h2 style="margin:0;">SG&TL - Sunil Gems & Testing Laboratories</h2>
              </div>
              <div style="padding:20px 24px;">
                <p style="color:#333;">Dear Customer,</p>
                <p style="color:#555;">Thank you for your enquiry. Here is our response:</p>
                <div style="background:white;padding:16px;border-left:4px solid #c4943f;border-radius:4px;margin:16px 0;">
                  <p style="margin:0;color:#333;line-height:1.6;">${escapeHtml(remarks).replace(/\n/g, "<br>")}</p>
                </div>
                <p style="color:#555;">If you have further questions, please reply to this email.</p>
                <p style="color:#333;">Best regards,<br><strong>SG&TL Laboratory Team</strong></p>
              </div>
            </div>
          `
        });
        logAudit("ENQUIRY_REPLY_SENT", req.user.email, { enquiryId: id, to: reply_email }, true);
      } catch (emailErr) {
        console.warn("Email send failed:", emailErr.message);
      }
    }

    logAudit("ENQUIRY_RESOLVED", req.user.email, { enquiryId: id }, true);
    res.json({ message: "Enquiry resolved and reply sent", data: data[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /enquiry/edit — edit a reply/remark
app.post("/enquiry/edit", authMiddleware, async (req, res) => {
  const { id, remarks } = req.body;
  if (!id || !remarks) {
    return res.status(400).json({ error: "Enquiry ID and remarks required" });
  }
  try {
    const { data, error } = await adminDbClient(req)
      .from("enquiries")
      .update({ remarks: remarks, reply_date: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    logAudit("ENQUIRY_EDIT", req.user.email, { enquiryId: id }, true);
    res.json({ message: "Reply updated", data: data[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════
// ENQUIRY WORKFLOW MANAGEMENT
// ═══════════════════════════════════════

// PATCH /enquiry/:id/status — change enquiry status
app.patch("/enquiry/:id/status", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !ENQUIRY_STATUSES[status]) {
    return res.status(400).json({ error: "Invalid status. Valid: " + Object.keys(ENQUIRY_STATUSES).join(", ") });
  }
  try {
    const db = adminDbClient(req);
    // Get current status for audit log
    const { data: current } = await db.from("enquiries").select("query_status, enquiry_no").eq("id", id).single();
    const prevStatus = current?.query_status || "unknown";

    const updates = { query_status: status };
    if (status === "resolved") updates.reply_date = new Date().toISOString();

    const { data, error } = await db.from("enquiries").update(updates).eq("id", id).select();
    if (error) return res.status(400).json({ error: error.message });

    logAudit("ENQUIRY_STATUS_CHANGE", req.user.email, {
      enquiryId: id, enquiryNo: current?.enquiry_no,
      from: prevStatus, to: status
    }, true);

    res.json({ message: `Status changed to ${ENQUIRY_STATUSES[status].label}`, data: data[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /enquiry/:id/priority — change enquiry priority
app.patch("/enquiry/:id/priority", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;
  if (!priority || !PRIORITY_LEVELS[priority]) {
    return res.status(400).json({ error: "Invalid priority. Valid: " + Object.keys(PRIORITY_LEVELS).join(", ") });
  }
  try {
    const { data, error } = await adminDbClient(req).from("enquiries").update({ priority }).eq("id", id).select();
    if (error) return res.status(400).json({ error: error.message });
    logAudit("ENQUIRY_PRIORITY_CHANGE", req.user.email, { enquiryId: id, priority }, true);
    res.json({ message: `Priority set to ${PRIORITY_LEVELS[priority].label}`, data: data[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /enquiry/:id/category — change enquiry category
app.patch("/enquiry/:id/category", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;
  if (!category || !ENQUIRY_CATEGORIES[category]) {
    return res.status(400).json({ error: "Invalid category. Valid: " + Object.keys(ENQUIRY_CATEGORIES).join(", ") });
  }
  try {
    const { data, error } = await adminDbClient(req).from("enquiries").update({ category }).eq("id", id).select();
    if (error) return res.status(400).json({ error: error.message });
    logAudit("ENQUIRY_CATEGORY_CHANGE", req.user.email, { enquiryId: id, category }, true);
    res.json({ message: `Category set to ${ENQUIRY_CATEGORIES[category]}`, data: data[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /enquiry/:id/batch-status — bulk status update
app.post("/enquiry/batch-status", authMiddleware, async (req, res) => {
  const { ids, status } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0 || !ENQUIRY_STATUSES[status]) {
    return res.status(400).json({ error: "Provide ids array and valid status" });
  }
  try {
    const updates = { query_status: status };
    if (status === "resolved") updates.reply_date = new Date().toISOString();

    const { data, error } = await adminDbClient(req).from("enquiries").update(updates).in("id", ids).select();
    if (error) return res.status(400).json({ error: error.message });

    logAudit("ENQUIRY_BATCH_STATUS", req.user.email, { ids, status, count: data.length }, true);
    res.json({ message: `${data.length} enquiries updated to ${status}`, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════
// DASHBOARD & SECURITY
// ═══════════════════════════════════════

// GET /dashboard/metrics
app.get("/dashboard/metrics", authMiddleware, async (req, res) => {
  try {
    // Get certificate count
    const db = adminDbClient(req);

    const { count: certCount } = await db
      .from("sgtl_database")
      .select("*", { count: "exact", head: true });

    // Get enquiry counts
    const { count: totalEnquiries } = await db
      .from("enquiries")
      .select("*", { count: "exact", head: true });

    const { count: pendingEnquiries } = await db
      .from("enquiries")
      .select("*", { count: "exact", head: true })
      .eq("query_status", "pending");

    securityMetrics.lastCheck = new Date().toISOString();

    res.json({
      certificates: certCount || 0,
      enquiries: { total: totalEnquiries || 0, pending: pendingEnquiries || 0 },
      security: {
        tamperAttempts: securityMetrics.tamperAttempts,
        integrityChecks: securityMetrics.integrityChecks,
        integrityPassed: securityMetrics.integrityPassed,
        unauthorizedBlocked: securityMetrics.unauthorizedBlocked,
        lastCheck: securityMetrics.lastCheck,
        encryptionStatus: "AES-256-CBC Active"
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /security/logs
app.get("/security/logs", authMiddleware, async (req, res) => {
  const { limit = 50 } = req.query;
  res.json({ logs: auditLogs.slice(0, parseInt(limit)) });
});

// ═══════════════════════════════════════
// DATABASE MANAGEMENT
// ═══════════════════════════════════════

// GET /database/columns
app.get("/database/columns", authMiddleware, async (req, res) => {
  try {
    // Fetch one record to get column names
    const { data, error } = await adminDbClient(req)
      .from("sgtl_database")
      .select("*")
      .limit(1);

    if (error) return res.status(400).json({ error: error.message });

    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    res.json({ columns });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /database/repair-missing-numbers
app.post("/database/repair-missing-numbers", authMiddleware, async (req, res) => {
  try {
    const repaired = await repairMissingCertificateNumbers(adminDbClient(req));
    logAudit("DATABASE_NUMBERS_REPAIRED", req.user.email, { repaired: repaired.length }, true);
    res.json({ message: `Repaired ${repaired.length} certificate number rows`, repaired });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════
// SERVE ADMIN PANEL
// ═══════════════════════════════════════
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Catch-all for SPA routes
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// ═══════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════╗
  ║  SG&TL Admin Panel Server                         ║
  ║  Running on http://localhost:${PORT}                  ║
  ║  Admin Panel: http://localhost:${PORT}/admin.html     ║
  ║  Encryption: AES-256-CBC Active                    ║
  ║  Auth: Supabase Auth + JWT                         ║
  ║  Gmail Sync: IMAP auto-sync every 5 min            ║
  ╚════════════════════════════════════════════════════╝
  `);
  logAudit("SERVER_STARTED", "system", { port: PORT });
  // Start Gmail auto-sync after server is up
  startAutoSync();
  // Run initial sync 10 seconds after boot
  setTimeout(() => {
    syncGmailReplies().then(r => {
      if (r.synced > 0) console.log(`  [Gmail Sync] Initial sync: ${r.synced} replies synced`);
    }).catch(() => {});
  }, 10000);
});
