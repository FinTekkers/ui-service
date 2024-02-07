const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".DS_Store","favicon.png","images/.DS_Store"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.90dd38c8.js","app":"_app/immutable/entry/app.566ae734.js","imports":["_app/immutable/entry/start.90dd38c8.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/singletons.6ee9b6c7.js","_app/immutable/chunks/index.5675a6da.js","_app/immutable/entry/app.566ae734.js","_app/immutable/chunks/index.225eb311.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('./chunks/0-9130fcbc.js')),
			__memo(() => import('./chunks/1-3598c3aa.js')),
			__memo(() => import('./chunks/2-7aa53595.js')),
			__memo(() => import('./chunks/3-752f7f0f.js')),
			__memo(() => import('./chunks/4-5e94786f.js')),
			__memo(() => import('./chunks/5-a621e6ac.js')),
			__memo(() => import('./chunks/6-6148b09f.js')),
			__memo(() => import('./chunks/7-a9845ba6.js')),
			__memo(() => import('./chunks/8-c295c4c8.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/contactus",
				pattern: /^\/contactus\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/portfolios",
				pattern: /^\/portfolios\/?$/,
				params: [],
				page: { layouts: [0,3,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/security/[id]",
				pattern: /^\/security\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();

export { manifest };
//# sourceMappingURL=manifest.js.map
