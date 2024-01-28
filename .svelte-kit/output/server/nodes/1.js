

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.b532f1c5.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/stores.ca275ef7.js","_app/immutable/chunks/singletons.5826a6e1.js","_app/immutable/chunks/index.5675a6da.js"];
export const stylesheets = [];
export const fonts = [];
