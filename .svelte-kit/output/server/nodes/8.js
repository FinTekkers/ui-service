import * as server from '../entries/pages/security/_id_/_page.server.ts.js';

export const index = 8;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/security/_id_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/security/[id]/+page.server.ts";
export const imports = ["_app/immutable/nodes/8.b2f6e282.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/stores.bdeb8c48.js","_app/immutable/chunks/singletons.ca587e60.js","_app/immutable/chunks/index.5675a6da.js"];
export const stylesheets = [];
export const fonts = [];
