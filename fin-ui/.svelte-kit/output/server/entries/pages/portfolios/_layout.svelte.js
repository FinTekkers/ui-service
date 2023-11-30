import { c as create_ssr_component } from "../../../chunks/index3.js";
import "../../../chunks/ProgressBar.svelte_svelte_type_style_lang.js";
const _layout_svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-s05ges::before,.svelte-s05ges::after,.svelte-s05ges{padding:0;margin:0;box-sizing:border-box}",
  map: null
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `${slots.default ? slots.default({}) : ``}`;
});
export {
  Layout as default
};
