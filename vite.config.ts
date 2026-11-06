import { resolve } from "node:path";
import type { Connect } from "vite";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { route } from "./server/staff";

// Serves the staff API (api/staff/*) in `vite` and `vite preview`, the same code Vercel runs.
const staffApi = (): Connect.NextHandleFunction => (req, res, next) => {
  if (req.url?.startsWith("/api/menu")) return void route(req, res, "table-menu");
  if (req.url?.startsWith("/api/offers")) return void route(req, res, "offers");
  const match = req.url?.match(/^\/api\/staff\/([a-z]+)/);
  if (!match) return next();
  void route(req, res, match[1]);
};

export default defineConfig(({ mode }) => {
  // Secrets from .env go to process.env for the local API only. They are never VITE_ prefixed,
  // so Vite never puts them in the browser bundle.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [
      react(),
      {
        name: "staff-api",
        configureServer: (server) => void server.middlewares.use(staffApi()),
        configurePreviewServer: (server) => void server.middlewares.use(staffApi()),
      },
    ],
    build: {
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), "index.html"),
          staff: resolve(process.cwd(), "staff/index.html"),
          restaurantMenu: resolve(process.cwd(), "restaurant-menu/index.html"),
          barMenu: resolve(process.cwd(), "bar-menu/index.html"),
        },
      },
    },
  };
});
