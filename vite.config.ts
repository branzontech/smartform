import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // La API (smartform-backend) se sirve bajo el mismo origen, como en
    // producción: la cookie de sesión es de primera parte.
    proxy: {
      "/api": { target: process.env.API_PROXY_TARGET ?? "http://localhost:5340", changeOrigin: false },
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
