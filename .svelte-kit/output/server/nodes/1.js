

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.2e3e3343.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/stores.0de4a591.js","_app/immutable/chunks/singletons.7ce71d58.js","_app/immutable/chunks/index.5675a6da.js"];
export const stylesheets = [];
export const fonts = [];
