import { r as redirect } from './index-4dc5572a.js';
import { c as create$3, a as create$6 } from './index.esm-a21df4f5.js';

const signInSchema = create$3({
  email: create$6().email().required("please enter email"),
  password: create$6().required("please enter password")
});
const actions = {
  login: async ({ request }) => {
    let formError = null;
    let isValid = null;
    try {
      const data = await request.formData();
      const email = data.get("Email");
      const password = data.get("Password");
      isValid = await signInSchema.validate({ email, password }, { abortEarly: false });
      if (email && password) {
      }
    } catch (validationError) {
      if (isValidationError(validationError)) {
        const validationErrors = validationError.inner.map((error) => error.message);
        formError = validationErrors;
      } else {
        console.log("error", validationError);
      }
    }
    if (isValid && !formError) {
      throw redirect(303, "/portfolios");
    }
    return { formError };
  }
};
function isValidationError(error) {
  return error?.inner !== void 0;
}

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  actions: actions
});

const index = 6;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-eafd3db6.js')).default;
const server_id = "src/routes/login/+page.server.ts";
const imports = ["_app/immutable/nodes/6.4aab0553.js","_app/immutable/chunks/index.225eb311.js","_app/immutable/chunks/store.d6707496.js","_app/immutable/chunks/index.5675a6da.js"];
const stylesheets = ["_app/immutable/assets/6.ce4945ba.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=6-6148b09f.js.map
