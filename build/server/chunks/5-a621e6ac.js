const actions = {
  message: async ({ request }) => {
    try {
      const data = await request.formData();
      console.log(data.get("email"));
      for (const [key, value] of data.entries()) {
        console.log(`${key}: ${value}`);
      }
    } catch (error) {
    }
  }
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions
});

const index = 5;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-4b4c3c24.js')).default;
const server_id = "src/routes/contactus/+page.server.ts";
const imports = ["_app/immutable/nodes/5.9bced1ba.js","_app/immutable/chunks/index.225eb311.js"];
const stylesheets = ["_app/immutable/assets/5.12b3f442.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=5-a621e6ac.js.map
