import { bindings, defineConfig, defineWorker } from "cf/config";
import { createWorkersResponseStoreServiceBindingConfig } from "@vinext/cloudflare/cache/config";

const responseStore = await createWorkersResponseStoreServiceBindingConfig({
  worker: {
    name: "clinicos-response-store",
    compatibilityDate: "2026-11-19",
  },
  bucket: "clinicos-response-store-cache-bodies",
});

export const responseStoreServiceBinding = responseStore.serviceBindingWorker;

export default defineConfig({
  worker: defineWorker({
    ...responseStore.applicationWorker,
    name: "clinicos",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-19",
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ...responseStore.applicationWorker.env,
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      // Hyperdrive — proxy/cache para PostgreSQL (Supabase/Neon/etc.)
      // Crie com: npx wrangler hyperdrive create clinicos-db --connection-string="postgresql://..."
      // Depois substitua REPLACE_WITH_HYPERDRIVE_ID pelo ID gerado.
      HYPERDRIVE: bindings.hyperdrive({
        id: "REPLACE_WITH_HYPERDRIVE_ID",
        dev: {
          connectionString: "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable",
        },
      }),
    },
  }),
});
