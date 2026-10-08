// Test stand-in for SvelteKit's `$app/paths` (aliased in vitest.config.js).
// `base` is "" like svelte.config.js; tests can call setBase() to check
// links under a base path.
export let base = "";
export const assets = "";

export const setBase = (value: string) => {
  base = value;
};
