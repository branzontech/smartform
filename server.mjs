/**
 * Servidor de producción de la web (Railway), sin dependencias:
 *   · sirve la app compilada (dist/) con vuelta a index.html para las rutas del SPA;
 *   · reenvía /api/* a la API (smartform-backend) por la red privada de Railway.
 *
 * Con la API bajo el mismo origen, la cookie de sesión es de primera parte: no
 * depende de cookies de terceros, que los navegadores bloquean cada vez más.
 *
 *   PORT              lo pone Railway
 *   API_INTERNAL_URL  p. ej. http://smartform-api.railway.internal:8080
 */
import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const PORT = Number(process.env.PORT ?? 8080);
const RAIZ = resolve("dist");
const API = new URL(process.env.API_INTERNAL_URL ?? "http://localhost:5340");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const SEGURIDAD = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
};

/** Cabeceras que no se reenvían (de un salto, no de extremo a extremo). */
const SALTO = new Set(["connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-connection"]);

function reenviarApi(req, res) {
  const cabeceras = Object.fromEntries(Object.entries(req.headers).filter(([k]) => !SALTO.has(k)));
  cabeceras["x-forwarded-host"] = req.headers.host ?? "";
  cabeceras["x-forwarded-proto"] = req.headers["x-forwarded-proto"] ?? "https";
  const salida = http.request(
    { hostname: API.hostname, port: API.port || 80, path: req.url, method: req.method, headers: cabeceras, timeout: 60_000 },
    (respuesta) => {
      const vuelta = Object.fromEntries(Object.entries(respuesta.headers).filter(([k]) => !SALTO.has(k)));
      res.writeHead(respuesta.statusCode ?? 502, vuelta);
      respuesta.pipe(res);
    },
  );
  salida.on("timeout", () => salida.destroy(new Error("La API no respondió a tiempo")));
  salida.on("error", (error) => {
    console.error(`[web] ${req.method} ${req.url} -> API: ${error.message}`);
    if (!res.headersSent) res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "La API no está disponible" }));
  });
  req.pipe(salida);
}

async function archivo(ruta) {
  try {
    const info = await stat(ruta);
    return info.isFile() ? info : null;
  } catch {
    return null;
  }
}

async function servirEstatico(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  const camino = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const pedido = normalize(join(RAIZ, camino));
  // Nada fuera de dist/ (../, rutas absolutas codificadas…).
  const dentro = pedido === RAIZ || pedido.startsWith(RAIZ + sep);
  let ruta = dentro ? pedido : null;
  let info = ruta ? await archivo(ruta) : null;

  if (!info) {
    // Recursos con extensión que no existen: 404. Rutas del SPA: index.html.
    if (extname(camino)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...SEGURIDAD }).end("No encontrado");
      return;
    }
    ruta = join(RAIZ, "index.html");
    info = await archivo(ruta);
    if (!info) {
      res.writeHead(500).end("Falta dist/index.html: ¿se ejecutó npm run build?");
      return;
    }
  }

  const inmutable = ruta.includes(`${sep}assets${sep}`);
  res.writeHead(200, {
    "Content-Type": TIPOS[extname(ruta).toLowerCase()] ?? "application/octet-stream",
    "Content-Length": info.size,
    "Cache-Control": inmutable ? "public, max-age=31536000, immutable" : "no-cache",
    ...SEGURIDAD,
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(ruta).pipe(res);
}

const servidor = http.createServer((req, res) => {
  const url = req.url ?? "/";
  if (url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" }).end("ok");
    return;
  }
  if (url === "/api" || url.startsWith("/api/")) {
    reenviarApi(req, res);
    return;
  }
  servirEstatico(req, res).catch((error) => {
    console.error(`[web] ${req.method} ${url}:`, error);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
});

servidor.listen(PORT, () => console.log(`[web] escuchando en :${PORT}; API en ${API.origin}`));

const cerrar = () => servidor.close(() => process.exit(0));
process.on("SIGTERM", cerrar);
process.on("SIGINT", cerrar);
