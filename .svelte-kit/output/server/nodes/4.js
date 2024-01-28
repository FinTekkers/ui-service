import * as server from '../entries/pages/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.6d18e6ab.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/store.b34dda3a.js","_app/immutable/chunks/index.5675a6da.js","_app/immutable/chunks/helper.0e794cd8.js"];
export const stylesheets = ["_app/immutable/assets/4.2e1ba1f3.css"];
export const fonts = [];
