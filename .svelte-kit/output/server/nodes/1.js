

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.81369320.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/stores.83b9471e.js","_app/immutable/chunks/singletons.ec5cf494.js","_app/immutable/chunks/index.5675a6da.js"];
export const stylesheets = [];
export const fonts = [];
