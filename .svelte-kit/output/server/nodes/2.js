

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/login/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.5972cb2c.js","_app/immutable/chunks/index.225eb311.js"];
export const stylesheets = [];
export const fonts = [];
