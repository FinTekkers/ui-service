

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.3aa35540.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/stores.a22d340d.js","_app/immutable/chunks/singletons.1a15a3bc.js","_app/immutable/chunks/index.5675a6da.js"];
export const stylesheets = [];
export const fonts = [];
