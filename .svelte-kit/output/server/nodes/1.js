

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.8558e873.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/stores.53474c11.js","_app/immutable/chunks/singletons.6ee9b6c7.js","_app/immutable/chunks/index.5675a6da.js"];
export const stylesheets = [];
export const fonts = [];
