const http = require('http');
const fs = require('fs');
const path = require('path');
// 1. Import Supabase
const { createClient } = require('@supabase/supabase-js');

// 2. Initialize Supabase client with your credentials
const SUPABASE_URL = "https://clllfjxkhcozphqxssbb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbGxmanhraGNvenBocXhzc2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NzY2MjIsImV4cCI6MjA5NDU1MjYyMn0.2rfdtPvTnxOVwnyYOt3JiWopUvmhsRJEPYEs3bSEqZ0";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const dir = 'C:\\Users\\Lenovo\\Documents\\SGTL Project';
const mimeTypes = {
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.gif':'image/gif',
  '.pdf':'application/pdf',
  '.txt':'text/plain; charset=utf-8',
  '.xml':'application/xml; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8'
};

http.createServer((req, res) => {
  // Add CORS headers so your frontend components can talk to it cleanly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 3. INTERCEPT POST REQUESTS TO /api/enquiry
  if (req.url === '/api/enquiry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { first_name, last_name, email, phone, message } = JSON.parse(body);
        
        // 4. THIS IS WHERE YOUR SUPABASE INSERT CODE LIVES
        const { data, error } = await supabase
          .from('enquiries')
          .insert([
            { first_name, last_name, email, phone, message }
          ]);

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

  // 5. Existing static file streaming logic handles everything else
  let p = decodeURIComponent(req.url === '/' ? '/index.html' : req.url).split('?')[0];
  let fp = path.join(dir, p);
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end('Not found'); return; }
  let ext = path.extname(fp).toLowerCase();
  res.writeHead(200, {'Content-Type': mimeTypes[ext]||'application/octet-stream'});
  fs.createReadStream(fp).pipe(res);
}).listen(8080, () => console.log('Serving everything on 8080'));