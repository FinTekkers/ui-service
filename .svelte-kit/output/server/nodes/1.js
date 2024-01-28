

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.8320d338.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/stores.bdeb8c48.js","_app/immutable/chunks/singletons.ca587e60.js","_app/immutable/chunks/index.5675a6da.js"];
export const stylesheets = [];
export const fonts = [];
