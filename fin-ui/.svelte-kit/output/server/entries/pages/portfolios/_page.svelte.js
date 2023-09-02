import { c as create_ssr_component, f as subscribe } from "../../../chunks/index2.js";
import { p as portfolioStore } from "../../../chunks/store.js";
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ":root{--grid-height:75vh}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_portfolioStore;
  $$unsubscribe_portfolioStore = subscribe(portfolioStore, (value) => value);
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  $$result.css.add(css);
  $$unsubscribe_portfolioStore();
  return `

<div class="background_col w-screen h-full flex">
  
  
</div>`;
});
export {
  Page as default
};
