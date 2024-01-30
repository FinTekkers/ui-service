import './index-4dc5572a.js';
import { c as create$3, a as create$6 } from './index.esm-a21df4f5.js';

create$3({
  searchQuery: create$6().min(3, "please enter a word").required("please enter text")
});
const actions = {
  search: async ({ request }) => {
    try {
      const data = await request.formData();
      const searchQuery = data.get("search");
      console.log("search query", searchQuery);
    } catch (error) {
      console.log("something went wrong", error);
    }
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions
});

const index = 4;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-d05735c8.js')).default;
const server_id = "src/routes/+page.server.ts";
const imports = ["_app/immutable/nodes/4.3f63bece.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/store.d6707496.js","_app/immutable/chunks/index.5675a6da.js","_app/immutable/chunks/helper.0e794cd8.js"];
const stylesheets = ["_app/immutable/assets/4.2e1ba1f3.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=4-5e94786f.js.map
