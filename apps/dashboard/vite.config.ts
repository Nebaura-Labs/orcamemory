import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const envRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envRoot, "");

  return {
    plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), viteReact()],
    server: {
      port: 3002,
      allowedHosts: ["dev.orcamemory.com", "app.orcamemory.com", "orcamemory.com"],
    },
    preview: {
      allowedHosts: ["dev.orcamemory.com", "app.orcamemory.com", "orcamemory.com"],
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      minify: true,
    },
    ssr: {
      noExternal: ["@convex-dev/better-auth"],
    },
  };
});
