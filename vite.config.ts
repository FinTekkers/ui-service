import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        silenceDeprecations: ['import'],
      },
    },
  },
  // #348: bundle @fintekkers/ledger-models + google-protobuf into the
  // SSR output. Both packages ship legacy CommonJS with
  // `goog.object.extend(exports, proto.<namespace>)` — Node's ESM/CJS
  // interop (cjs-module-lexer) can't statically detect those exports,
  // so `node build` fails during SvelteKit's analyse step with
  // "does not provide an export named 'GetFieldValuesRequestProto'"
  // (and every other proto class). vite dev works because esbuild
  // handles CJS at request time. `ssr.noExternal` tells vite to bundle
  // these deps into the SSR output too, so the built server file
  // contains the CJS bodies directly and there's nothing to re-import
  // through Node's ESM loader. This is the fix that lets the prod
  // build actually run — before this the deploy fell back to
  // `npm run dev` (see build_deploy.py "build fails... unsure why").
  ssr: {
    // Bundle ledger-models + every transitive dep it `require()`s into
    // the SSR output. Vite/esbuild rewrites those `require()` calls into
    // `import require$$N from '<dep>'` — modern ESM-only deps (uuid v9,
    // luxon, decimal.js, dotenv) don't have a default export, so the
    // synthesised default import fails at Node's analyse step. Listing
    // each here lets vite bundle them and rewrite the access into
    // named-import form.
    noExternal: [
      '@fintekkers/ledger-models',
      'google-protobuf',
      'uuid',
      'luxon',
      'decimal.js',
      'dotenv',
      'bytebuffer',
      '@grpc/grpc-js',
      '@grpc/proto-loader',
      '@js-sdsl/ordered-map',
      /^@protobufjs\//,
    ],
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
