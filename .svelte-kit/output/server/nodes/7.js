import * as server from '../entries/pages/portfolios/_page.server.ts.js';

export const index = 7;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/portfolios/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/portfolios/+page.server.ts";
export const imports = ["_app/immutable/nodes/7.01596595.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/store.b34dda3a.js","_app/immutable/chunks/index.5675a6da.js","_app/immutable/chunks/helper.0e794cd8.js"];
export const stylesheets = ["_app/immutable/assets/7.b2708ccc.css"];
export const fonts = [];
