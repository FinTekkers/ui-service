import * as server from '../entries/pages/portfolios/_page.server.ts.js';

export const index = 7;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/portfolios/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/portfolios/+page.server.ts";
export const imports = ["_app/immutable/nodes/7.9924ccd7.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/store.70521b78.js","_app/immutable/chunks/index.5675a6da.js","_app/immutable/chunks/helper.bb3fcca4.js"];
export const stylesheets = ["_app/immutable/assets/7.a5ef7a4b.css"];
export const fonts = [];
