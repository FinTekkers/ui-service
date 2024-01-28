import * as server from '../entries/pages/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.dd1267fc.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/store.70521b78.js","_app/immutable/chunks/index.5675a6da.js","_app/immutable/chunks/helper.bb3fcca4.js"];
export const stylesheets = ["_app/immutable/assets/4.b847e340.css"];
export const fonts = [];
