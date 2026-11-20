import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { responseStoreServiceBinding } from "./cloudflare.config";
import { responseStoreAdapter } from "@vinext/cloudflare/cache/response-store-adapter";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

export default defineConfig({
  ssr: {
    external: ['@node-rs/argon2', '@electric-sql/pglite', 'pg'],
  },
  optimizeDeps: {
    exclude: ['@node-rs/argon2', '@electric-sql/pglite', 'pg'],
  },
  build: {
    rollupOptions: {
      external: ['@node-rs/argon2', '@electric-sql/pglite', 'pg'],
    },
  },
  plugins: [
    vinext({
      cache: responseStoreAdapter(),
      prerender: { routes: "*" },
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      auxiliaryWorkers: [{ config: responseStoreServiceBinding }],
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
