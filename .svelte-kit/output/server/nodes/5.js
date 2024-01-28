import * as server from '../entries/pages/contactus/_page.server.ts.js';

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/contactus/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/contactus/+page.server.ts";
export const imports = ["_app/immutable/nodes/5.4f9eaad9.js","_app/immutable/chunks/index.225eb311.js"];
export const stylesheets = ["_app/immutable/assets/5.bd436256.css"];
export const fonts = [];
