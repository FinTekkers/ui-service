import { c as create_ssr_component } from "../../../chunks/index3.js";
const _layout_svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-ufzeba::before,.svelte-ufzeba::after,.svelte-ufzeba{padding:0;margin:0;box-sizing:border-box}.main_ui_menu.svelte-ufzeba{width:100vw;height:100vh;max-height:100vh !important;overflow:hidden}",
  map: null
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<div class="main_ui_menu grow svelte-ufzeba">${slots.default ? slots.default({}) : ``}
</div>`;
});
export {
  Layout as default
};
