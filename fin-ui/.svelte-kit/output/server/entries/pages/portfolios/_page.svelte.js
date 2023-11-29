import { c as create_ssr_component, d as subscribe, v as validate_component } from "../../../chunks/index3.js";
import { c as currentMenu } from "../../../chunks/store.js";
import { I as Icon } from "../../../chunks/Icon.js";
var menuList = /* @__PURE__ */ ((menuList2) => {
  menuList2["Home"] = "home";
  menuList2["Dashboard"] = "Dashboard";
  menuList2["Portfolio"] = "Portfolio";
  menuList2["Account"] = "Account";
  menuList2["Logout"] = "Logout";
  return menuList2;
})(menuList || {});
const Main_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".svelte-1r12piu.svelte-1r12piu::before,.svelte-1r12piu.svelte-1r12piu::after,.svelte-1r12piu.svelte-1r12piu{padding:0;margin:0;box-sizing:border-box}.mainmenu_container.svelte-1r12piu.svelte-1r12piu{background-color:whitesmoke;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:0}.mainmenu_container.svelte-1r12piu .menu.svelte-1r12piu{width:98%;height:98%;padding:1em;border-radius:5px;background-color:whitesmoke;color:#1b6f85}",
  map: null
};
const Main = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $currentMenu, $$unsubscribe_currentMenu;
  $$unsubscribe_currentMenu = subscribe(currentMenu, (value) => $currentMenu = value);
  $$result.css.add(css$1);
  $$unsubscribe_currentMenu();
  return `
<div class="p-5 h-full w-screen mainmenu_container svelte-1r12piu">${$currentMenu == menuList.Home ? `<div class="menu svelte-1r12piu">Home
     <a href="/security/1" class="svelte-1r12piu">→✅</a></div>` : `${$currentMenu == menuList.Dashboard ? `<div class="menu svelte-1r12piu">Dashboard
      <a href="/security/2" class="svelte-1r12piu">→✅</a></div>` : `${$currentMenu == menuList.Portfolio ? `<div class="menu svelte-1r12piu">Portfolio</div>` : `${$currentMenu == menuList.Account ? `<div class="menu svelte-1r12piu">Account</div>` : `${$currentMenu == menuList.Logout ? `<div class="menu svelte-1r12piu">Goodbye</div>` : ``}`}`}`}`}
</div>`;
});
const SideMenu_svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-s4pqjn::before,.svelte-s4pqjn::after,.svelte-s4pqjn{padding:0;margin:0;box-sizing:border-box}.sidemenu_container.svelte-s4pqjn{padding:2em 0 0 2em;background-color:whitesmoke;box-shadow:2px 2px 10px rgba(206, 206, 206, 0.034);width:20vw}.custom-menutitle.svelte-s4pqjn{display:flex;position:relative;gap:10px;color:#1b6f85}.custom-menutitle-logout.svelte-s4pqjn{color:#1b6f85}",
  map: null
};
const SideMenu = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<div class="w-1/4 p-5 flex flex-col gap-20 relative sidemenu_container svelte-s4pqjn"><div class="p-2 custom-menutitle cursor-pointer svelte-s4pqjn">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "material-symbols:home",
      class: "menu_icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span class="svelte-s4pqjn">Home</span></div>
  <div class="p-2 custom-menutitle cursor-pointer svelte-s4pqjn">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "ic:baseline-dashboard",
      class: "menu_icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span class="svelte-s4pqjn">Dashboard</span></div>
  <div class="p-2 custom-menutitle gap-4 cursor-pointer svelte-s4pqjn">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:graph-new-bold",
      class: "align-bottom text-lg",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span class="svelte-s4pqjn">Portfolio</span></div>
  <div class="p-2 custom-menutitle cursor-pointer svelte-s4pqjn">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "ant-design:setting-filled",
      class: "menu_icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span class="svelte-s4pqjn">Account</span></div>
  <div class="absolute custom-menutitle-logout bottom-20 mx-w-1xl p-2 flex gap-4 cursor-pointer svelte-s4pqjn">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:logout-3-bold",
      class: "menu_icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span class="svelte-s4pqjn">Logout</span></div>
</div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `

<div class="w-screen h-full flex">${validate_component(SideMenu, "SideMenu").$$render($$result, {}, {}, {})}
  ${validate_component(Main, "Main").$$render($$result, {}, {}, {})}</div>`;
});
export {
  Page as default
};
