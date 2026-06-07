import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const webRoot = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = path.resolve(webRoot, "..");

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, webRoot, "");
  const proxyTarget = env.MULTIMODAL_PROXY_API_TARGET || "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    server: {
      fs: {
        allow: [projectRoot],
      },
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      globals: false,
      setupFiles: "./src/test/setup.ts",
      css: false,
    },
  };
});
