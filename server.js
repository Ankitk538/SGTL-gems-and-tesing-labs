const http = require('http');
const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\Lenovo\\Documents\\SGTL Project';
const mimeTypes = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.pdf':'application/pdf'};
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url === '/' ? '/index.html' : req.url).split('?')[0];
  let fp = path.join(dir, p);
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end('Not found'); return; }
  let ext = path.extname(fp).toLowerCase();
  res.writeHead(200, {'Content-Type': mimeTypes[ext]||'application/octet-stream','Access-Control-Allow-Origin':'*'});
  fs.createReadStream(fp).pipe(res);
}).listen(8080, () => console.log('Serving on 8080'));
