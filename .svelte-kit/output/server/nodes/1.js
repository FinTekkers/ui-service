

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.57c9133f.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/stores.e60aa036.js","_app/immutable/chunks/singletons.81795f21.js","_app/immutable/chunks/index.5675a6da.js"];
export const stylesheets = [];
export const fonts = [];
