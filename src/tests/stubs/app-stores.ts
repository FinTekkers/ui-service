// Test stand-in for SvelteKit's `$app/stores` (aliased in vitest.config.js).
// Only `page.url` is modelled; tests call page.set() to choose the path.
import { writable } from "svelte/store";

export const page = writable({ url: new URL("http://localhost/free/soma") });
