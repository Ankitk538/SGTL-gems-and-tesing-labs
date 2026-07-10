const http = require("http");
const fs = require("fs");
const path = require("path");
const dir = "C:/Users/Lenovo/Documents/SGTL Project";
http.createServer((req, res) => {
  let f = path.join(dir, req.url === "/" ? "index.html" : decodeURIComponent(req.url));
  let ext = path.extname(f).slice(1);
  let types = {html:"text/html",js:"application/javascript",css:"text/css",png:"image/png",jpg:"image/jpeg",svg:"image/svg+xml"};
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end("Not found"); }
    else { res.writeHead(200, {"Content-Type": types[ext] || "application/octet-stream"}); res.end(d); }
  });
}).listen(9092, () => console.log("Serving on 9092"));
