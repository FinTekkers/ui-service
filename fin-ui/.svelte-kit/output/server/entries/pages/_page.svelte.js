import { c as create_ssr_component, o as onDestroy, h as spread, i as escape_object, j as createEventDispatcher, f as subscribe, v as validate_component } from "../../chunks/index2.js";
import { c as checkIconState, g as generateIcon } from "../../chunks/SideMenu.svelte_svelte_type_style_lang.js";
import { c as currentMenu } from "../../chunks/store.js";
const Icon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const state = {
    // Last icon name
    name: "",
    // Loading status
    loading: null,
    // Destroyed status
    destroyed: false
  };
  let mounted = false;
  let data;
  const onLoad = (icon) => {
    if (typeof $$props.onLoad === "function") {
      $$props.onLoad(icon);
    }
    const dispatch = createEventDispatcher();
    dispatch("load", { icon });
  };
  function loaded() {
  }
  onDestroy(() => {
    state.destroyed = true;
  });
  {
    {
      const iconData = checkIconState($$props.icon, state, mounted, loaded, onLoad);
      data = iconData ? generateIcon(iconData.data, $$props) : null;
      if (data && iconData.classes) {
        data.attributes["class"] = (typeof $$props["class"] === "string" ? $$props["class"] + " " : "") + iconData.classes.join(" ");
      }
    }
  }
  return `${data ? `${data.svg ? `<svg${spread([escape_object(data.attributes)], {})}><!-- HTML_TAG_START -->${data.body}<!-- HTML_TAG_END --></svg>` : `<span${spread([escape_object(data.attributes)], {})}></span>`}` : ``}`;
});
const css$1 = {
  code: ".custom-menutitle.svelte-1a7jtm6{display:flex;position:relative;gap:10px}",
  map: null
};
const SideMenu = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $currentMenu, $$unsubscribe_currentMenu;
  $$unsubscribe_currentMenu = subscribe(currentMenu, (value) => $currentMenu = value);
  $$result.css.add(css$1);
  {
    console.log($currentMenu);
  }
  $$unsubscribe_currentMenu();
  return `<div class="w-1/4 p-5 border flex flex-col gap-10 relative"><div class="p-2 custom-menutitle cursor-pointer svelte-1a7jtm6">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "material-symbols:home",
      class: "menu_icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span>Home</span></div>
  <div class="p-2 custom-menutitle cursor-pointer svelte-1a7jtm6">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "ic:baseline-dashboard",
      class: "menu_icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span>Dashboard</span></div>
  <div class="p-2 custom-menutitle gap-4 cursor-pointer svelte-1a7jtm6">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:graph-new-bold",
      class: "align-bottom text-lg",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span>Portfolio</span></div>
  <div class="p-2 custom-menutitle cursor-pointer svelte-1a7jtm6">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "ant-design:setting-filled",
      class: "menu_icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span>Account</span></div>
  <div class="absolute bottom-10 mx-w-1xl p-2 flex gap-4 cursor-pointer">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:logout-3-bold",
      class: "menu_icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span>Logout</span></div>
</div>`;
});
const Container = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="p-5 border h-full w-screen">Home</div>`;
});
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ".background_col.svelte-1fjk8uc{background-color:red;border:solid 1px red}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<div class="background_col h-full flex justify-between svelte-1fjk8uc">${validate_component(SideMenu, "SideMenu").$$render($$result, {}, {}, {})}
  ${validate_component(Container, "Container").$$render($$result, {}, {}, {})}</div>

`;
});
export {
  Page as default
};
