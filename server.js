require('./load-env')();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Credentials come from .env (see .env.example). The anon key is public by
// design (it also ships in the browser), but it is kept out of source so the
// service key and other secrets can live in the same untracked file.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://clllfjxkhcozphqxssbb.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
if (!SUPABASE_ANON_KEY) {
  console.error('[FATAL] SUPABASE_ANON_KEY is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ROOT = __dirname;
const PORT = process.env.SERVE_PORT || 8080;
const MAX_BODY = 16 * 1024; // 16KB cap on the enquiry POST body

// CORS allowlist (comma-separated ALLOWED_ORIGINS in .env). No wildcard.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'http://localhost:8080,http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean);
function isAllowedOrigin(origin) {
  if (!origin) return false; // no Origin (same-origin/GET): no ACAO needed
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try { const h = new URL(origin).hostname; return h === 'localhost' || h === '127.0.0.1' || h === '::1'; }
  catch (e) { return false; }
}

// Files that must never be served even though they sit in the web root.
const BLOCKED = new Set([
  'server.js', 'admin-server.js', 'load-env.js',
  'package.json', 'package-lock.json',
  '.env', '.env.example'
]);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function applySecurityHeaders(res, origin) {
  // CORS: echo only allow-listed origins.
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Hardening headers.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' http://localhost:3000 " + SUPABASE_URL + " https://api.qrserver.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ].join('; '));
}

http.createServer((req, res) => {
  const origin = req.headers.origin;
  applySecurityHeaders(res, origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Enquiry submission ──
  if (req.url === '/api/enquiry' && req.method === 'POST') {
    let body = '';
    let aborted = false;
    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY) {
        aborted = true;
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });
    req.on('end', async () => {
      if (aborted) return;
      try {
        const { first_name, last_name, email, phone, message } = JSON.parse(body);
        if (!email || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email and message are required' }));
          return;
        }
        const { data, error } = await supabase
          .from('enquiries')
          .insert([{ first_name, last_name, email, phone, message }]);
        if (error) throw error;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ── Static files (traversal-safe) ──
  if (req.method !== 'GET') { res.writeHead(405); res.end('Method not allowed'); return; }

  const urlPath = decodeURIComponent((req.url === '/' ? '/index.html' : req.url).split('?')[0]);
  const rel = urlPath.replace(/^\/+/, '');
  const fp = path.normalize(path.join(ROOT, rel));

  // Containment: resolved path must stay inside ROOT.
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  const base = path.basename(fp);
  if (BLOCKED.has(base) || base.startsWith('.') || rel.split(/[\\/]/).includes('node_modules')) {
    res.writeHead(404); res.end('Not found'); return;
  }
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
    res.writeHead(404); res.end('Not found'); return;
  }

  const ext = path.extname(fp).toLowerCase();
  res.setHeader('Cache-Control', ext === '.html' ? 'public, max-age=300' : 'public, max-age=86400');
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
}).listen(PORT, () => console.log('Static server (traversal-safe) on ' + PORT));
