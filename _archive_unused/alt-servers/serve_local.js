const h=require('http'),f=require('fs'),p=require('path');
const d='C:/Users/Lenovo/Documents/SGTL Project';
h.createServer((q,s)=>{
  let u=decodeURIComponent(q.url.split('?')[0]);
  if(u==='/') u='/index.html';
  let fp=p.join(d,u);
  let e=p.extname(fp).slice(1);
  let t={html:'text/html;charset=utf-8',js:'application/javascript',css:'text/css',png:'image/png',jpg:'image/jpeg',svg:'image/svg+xml',ico:'image/x-icon',json:'application/json',woff2:'font/woff2',ttf:'font/ttf'}[e]||'application/octet-stream';
  f.readFile(fp,(err,data)=>{
    if(err){s.writeHead(404);s.end('Not found: '+u)}
    else{s.writeHead(200,{'Content-Type':t,'Access-Control-Allow-Origin':'*'});s.end(data)}
  });
}).listen(9093,'0.0.0.0',()=>console.log('Server on 9093'));
