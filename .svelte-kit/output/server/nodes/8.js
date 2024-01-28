import * as server from '../entries/pages/security/_id_/_page.server.ts.js';

export const index = 8;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/security/_id_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/security/[id]/+page.server.ts";
export const imports = ["_app/immutable/nodes/8.a6e40259.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/stores.e60aa036.js","_app/immutable/chunks/singletons.81795f21.js","_app/immutable/chunks/index.5675a6da.js"];
export const stylesheets = [];
export const fonts = [];
