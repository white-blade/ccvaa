// Serves the static export in out/ under the /ccvaa base path, as GitHub Pages does.
// Zero dependencies, so CI needs nothing beyond the build. Usage: node serve-static.mjs <port>
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve("out");
const base = "/ccvaa";
const port = Number(process.argv[2] ?? 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".json": "application/json",
};

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith(base)) {
    response.writeHead(302, { location: `${base}/` }).end();
    return;
  }
  let file = path.join(root, decodeURIComponent(url.pathname.slice(base.length)));
  if (!file.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  try {
    if (statSync(file).isDirectory()) file = path.join(file, "index.html");
    statSync(file);
  } catch {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
}).listen(port, () => console.log(`Serving out/ at http://localhost:${port}${base}/`));
