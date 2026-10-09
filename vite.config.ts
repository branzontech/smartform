import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/** Web de producción (Railway): reenvía /api a su API privada. */
const PRODUCTION_WEB_URL = "https://kerhub-web-production.up.railway.app";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // La API (smartform-backend) se sirve bajo el mismo origen, como en
    // producción: la cookie de sesión es de primera parte.
    proxy: {
      "/api": { target: process.env.API_PROXY_TARGET ?? "http://localhost:5340", changeOrigin: false },
      /**
       * Ambiente «Producción» elegido en el login (src/config/environments.ts).
       * La cookie de producción queda bajo /env/produccion: no viaja a la API
       * local. La API de producción solo acepta su propio origen (CSRF y Better
       * Auth), así que el proxy, que solo corre en este equipo, lo presenta.
       */
      "/env/produccion/api": {
        target: PRODUCTION_WEB_URL,
        changeOrigin: true,
        secure: true,
        rewrite: (url) => url.replace(/^\/env\/produccion/, ""),
        cookiePathRewrite: { "/": "/env/produccion" },
        configure: (proxy) => {
          proxy.on("proxyReq", (req) => {
            if (req.getHeader("origin")) req.setHeader("origin", PRODUCTION_WEB_URL);
            req.removeHeader("referer");
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
