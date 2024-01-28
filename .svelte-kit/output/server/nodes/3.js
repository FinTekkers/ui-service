

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/portfolios/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.b6c2e5c8.js","_app/immutable/chunks/index.225eb311.js"];
export const stylesheets = ["_app/immutable/assets/3.12c3cbe9.css"];
export const fonts = [];
