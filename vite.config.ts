import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    // The generated protobuf files in @fintekkers/ledger-models are CommonJS.
    // Left external, the server build emits raw `import { X } from "...pb.js"`
    // which Node's ESM loader rejects ("Named export not found") during
    // SvelteKit's postbuild analyse. `vite dev` never hits this, because it
    // resolves through Vite's own CJS interop instead — so this breaks
    // `npm run build` only, and dev gives no warning of it.
    //
    // The runtime deps ride along: bundling ledger-models rewrites its CJS
    // `require('uuid')` into `import require$$N from "uuid"`, and these
    // packages export no default to satisfy that, so each must be bundled too.
    //
    // @grpc/grpc-js is deliberately NOT here despite being a ledger-models
    // dependency. Bundling it fails in rollup on its own transitive dep
    // (`"default" is not exported by @js-sdsl/ordered-map`), and it doesn't
    // need bundling — nothing imports it in a way that trips the ESM loader.
    noExternal: [
      '@fintekkers/ledger-models',
      'google-protobuf',
      'bytebuffer',
      'decimal.js',
      'dotenv',
      'luxon',
      'uuid',
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        silenceDeprecations: ['import'],
      },
    },
  },
  server: {
    allowedHosts: true,
    headers: {
      'Access-Control-Allow-Origin': '*', // Allow all origins
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allowed HTTP methods
      'Access-Control-Allow-Credentials': 'true', // Allow credentials
      'Access-Control-Allow-Headers': 'Content-Type, Authorization' // Allowed headers
    }
  }
});
