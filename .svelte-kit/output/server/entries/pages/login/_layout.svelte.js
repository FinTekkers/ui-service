import { c as create_ssr_component } from "../../../chunks/index3.js";
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  console.log("test");
  return `${slots.default ? slots.default({}) : ``}`;
});
export {
  Layout as default
};
