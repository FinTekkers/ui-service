import { c as create_ssr_component, a as add_attribute, e as escape, b as compute_slots, d as subscribe, v as validate_component, n as null_to_empty } from "../../chunks/index3.js";
import "../../chunks/ProgressBar.svelte_svelte_type_style_lang.js";
import { I as Icon } from "../../chunks/Icon.js";
import { s as sideMenuStore } from "../../chunks/store.js";
const themeSkeleton = "";
const skeleton = "";
const app = "";
const cBaseAppShell = "w-full h-full flex flex-col overflow-hidden";
const cContentArea = "w-full h-full flex overflow-hidden";
const cPage = "flex-1 overflow-x-hidden flex flex-col";
const cSidebarLeft = "flex-none overflow-x-hidden overflow-y-auto";
const cSidebarRight = "flex-none overflow-x-hidden overflow-y-auto";
const AppShell = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesBase;
  let classesHeader;
  let classesSidebarLeft;
  let classesSidebarRight;
  let classesPageHeader;
  let classesPageContent;
  let classesPageFooter;
  let classesFooter;
  let $$slots = compute_slots(slots);
  let { regionPage = "" } = $$props;
  let { slotHeader = "z-10" } = $$props;
  let { slotSidebarLeft = "w-auto" } = $$props;
  let { slotSidebarRight = "w-auto" } = $$props;
  let { slotPageHeader = "" } = $$props;
  let { slotPageContent = "" } = $$props;
  let { slotPageFooter = "" } = $$props;
  let { slotFooter = "" } = $$props;
  if ($$props.regionPage === void 0 && $$bindings.regionPage && regionPage !== void 0)
    $$bindings.regionPage(regionPage);
  if ($$props.slotHeader === void 0 && $$bindings.slotHeader && slotHeader !== void 0)
    $$bindings.slotHeader(slotHeader);
  if ($$props.slotSidebarLeft === void 0 && $$bindings.slotSidebarLeft && slotSidebarLeft !== void 0)
    $$bindings.slotSidebarLeft(slotSidebarLeft);
  if ($$props.slotSidebarRight === void 0 && $$bindings.slotSidebarRight && slotSidebarRight !== void 0)
    $$bindings.slotSidebarRight(slotSidebarRight);
  if ($$props.slotPageHeader === void 0 && $$bindings.slotPageHeader && slotPageHeader !== void 0)
    $$bindings.slotPageHeader(slotPageHeader);
  if ($$props.slotPageContent === void 0 && $$bindings.slotPageContent && slotPageContent !== void 0)
    $$bindings.slotPageContent(slotPageContent);
  if ($$props.slotPageFooter === void 0 && $$bindings.slotPageFooter && slotPageFooter !== void 0)
    $$bindings.slotPageFooter(slotPageFooter);
  if ($$props.slotFooter === void 0 && $$bindings.slotFooter && slotFooter !== void 0)
    $$bindings.slotFooter(slotFooter);
  classesBase = `${cBaseAppShell} ${$$props.class ?? ""}`;
  classesHeader = `${slotHeader}`;
  classesSidebarLeft = `${cSidebarLeft} ${slotSidebarLeft}`;
  classesSidebarRight = `${cSidebarRight} ${slotSidebarRight}`;
  classesPageHeader = `${slotPageHeader}`;
  classesPageContent = `${slotPageContent}`;
  classesPageFooter = `${slotPageFooter}`;
  classesFooter = `${slotFooter}`;
  return `<div id="appShell"${add_attribute("class", classesBase, 0)} data-testid="app-shell">
	${$$slots.header ? `<header id="shell-header" class="${"flex-none " + escape(classesHeader, true)}">${slots.header ? slots.header({}) : ``}</header>` : ``}

	
	<div class="${"flex-auto " + escape(cContentArea, true)}">
		${$$slots.sidebarLeft ? `<aside id="sidebar-left"${add_attribute("class", classesSidebarLeft, 0)}>${slots.sidebarLeft ? slots.sidebarLeft({}) : ``}</aside>` : ``}

		
		<div id="page" class="${escape(regionPage, true) + " " + escape(cPage, true)}">
			${$$slots.pageHeader ? `<header id="page-header" class="${"flex-none " + escape(classesPageHeader, true)}">${slots.pageHeader ? slots.pageHeader({}) : `(slot:header)`}</header>` : ``}

			
			<main id="page-content" class="${"flex-auto " + escape(classesPageContent, true)}">${slots.default ? slots.default({}) : ``}</main>

			
			${$$slots.pageFooter ? `<footer id="page-footer" class="${"flex-none " + escape(classesPageFooter, true)}">${slots.pageFooter ? slots.pageFooter({}) : `(slot:footer)`}</footer>` : ``}</div>

		
		${$$slots.sidebarRight ? `<aside id="sidebar-right"${add_attribute("class", classesSidebarRight, 0)}>${slots.sidebarRight ? slots.sidebarRight({}) : ``}</aside>` : ``}</div>

	
	${$$slots.footer ? `<footer id="shell-footer" class="${"flex-none " + escape(classesFooter, true)}">${slots.footer ? slots.footer({}) : ``}</footer>` : ``}</div>`;
});
const _layout_svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-9oiej2.svelte-9oiej2::before,.svelte-9oiej2.svelte-9oiej2::after,.svelte-9oiej2.svelte-9oiej2{padding:0;margin:0;box-sizing:border-box}.debug.svelte-9oiej2.svelte-9oiej2{border:solid 1px red}.centerAbsolute.svelte-9oiej2.svelte-9oiej2{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%)}.body-cover.svelte-9oiej2.svelte-9oiej2{background-color:#0c3a46;position:absolute}.button.svelte-9oiej2.svelte-9oiej2{padding:0.5rem 1rem;border-radius:5px;background-color:#258ea8}.navigation_bar.svelte-9oiej2.svelte-9oiej2{height:8vh;padding:1em;background-color:#0c3a46;display:flex;flex-direction:center;justify-content:space-between;align-items:row;gap:1em}.navigation_bar.svelte-9oiej2 .logo.svelte-9oiej2{font-weight:bold;font-size:1.2rem}.navigation_bar.svelte-9oiej2 .navigation_links ul.svelte-9oiej2{display:flex;flex-direction:center;justify-content:flex-start;align-items:row;gap:1em;width:50vw}.navigation_bar.svelte-9oiej2 .search_bar .search_bar_form.svelte-9oiej2{width:20vw}.navigation_bar.svelte-9oiej2 .search_bar .search_bar_form .search_bar_container input.svelte-9oiej2{padding:0.5em 1em}.navigation_bar.svelte-9oiej2 .search_bar .search_bar_form .search_bar_container .search_btn.svelte-9oiej2{padding:0 0.3em;height:100%;position:absolute;top:0%;right:0%;font-size:0.8rem;background-color:#1b6f85;border-top-right-radius:6px;border-bottom-right-radius:6px}.Footer.svelte-9oiej2.svelte-9oiej2{width:100%;height:10vh;padding:1em;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;position:absolute;bottom:0;background-color:#0c3a46}.hamburger_nav.svelte-9oiej2.svelte-9oiej2{display:none}.hamburger_btn.svelte-9oiej2.svelte-9oiej2{display:none}@media screen and (max-width: 1200px){.navigation_bar.svelte-9oiej2.svelte-9oiej2{display:none}.hamburger_btn.svelte-9oiej2.svelte-9oiej2{display:block;position:absolute;right:0;margin:1em;z-index:100}.hidden.svelte-9oiej2.svelte-9oiej2{right:-100%}.show.svelte-9oiej2.svelte-9oiej2{right:0%}.hamburger_nav.svelte-9oiej2.svelte-9oiej2{display:block;width:30vw;height:100%;position:absolute;z-index:3;top:0;background-color:#1b6f85;transition:all 0.2s ease-in-out}}@media screen and (max-width: 600px){.hamburger_nav.svelte-9oiej2.svelte-9oiej2{width:100vw;background-color:#1b6f85}}",
  map: null
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $sideMenuStore, $$unsubscribe_sideMenuStore;
  $$unsubscribe_sideMenuStore = subscribe(sideMenuStore, (value) => $sideMenuStore = value);
  let { data } = $$props;
  let { form } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0)
    $$bindings.form(form);
  $$result.css.add(css);
  $$unsubscribe_sideMenuStore();
  return `${validate_component(AppShell, "AppShell").$$render($$result, {}, {}, {
    default: () => {
      return `<div class="${escape(null_to_empty(`hamburger_nav ${$sideMenuStore ? "show" : "hidden"}`), true) + " svelte-9oiej2"}"></div>

   <div class="hamburger_btn svelte-9oiej2">${$sideMenuStore ? `<button class="close_btn svelte-9oiej2">${validate_component(Icon, "Icon").$$render(
        $$result,
        {
          icon: "ic:outline-close",
          style: "width: 35px; height: 35px;"
        },
        {},
        {}
      )}</button>` : `<button class="open_btn svelte-9oiej2">${validate_component(Icon, "Icon").$$render(
        $$result,
        {
          icon: "mdi:hamburger-menu",
          style: "width: 35px; height: 35px;"
        },
        {},
        {}
      )}</button>`}</div>

    <div class="navigation_bar svelte-9oiej2"><div class="logo svelte-9oiej2">Fintekkers</div>
       <div class="navigation_links svelte-9oiej2"><ul class="svelte-9oiej2"><li class="svelte-9oiej2"><a href="#" class="svelte-9oiej2">Trial</a></li>
           <li class="svelte-9oiej2"><a href="#" class="svelte-9oiej2">Docs</a></li>
           <li class="svelte-9oiej2"><a href="#" class="svelte-9oiej2">Plugins</a></li>
           <li class="svelte-9oiej2"><a href="#" class="svelte-9oiej2">Playground</a></li>
           <li class="svelte-9oiej2"><a href="#" class="svelte-9oiej2">Contact Us</a></li></ul></div>
       <div class="search_bar svelte-9oiej2"><div class="search_bar_form svelte-9oiej2"><form method="post" action="/search" class="svelte-9oiej2"><label for="default-search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white svelte-9oiej2">Search</label>
                <div class="relative search_bar_container svelte-9oiej2"><input type="search" name="search" id="default-search" class="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 svelte-9oiej2" placeholder="Search Mockups, Logos..." required>
                    <button type="submit" class="search_btn dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 svelte-9oiej2">Search
                    </button></div></form></div></div></div>


  ${slots.default ? slots.default({}) : ``}
  <div class="Footer svelte-9oiej2"><div class="quicklinks svelte-9oiej2"><h1 class="svelte-9oiej2">Quicklinks</h1></div>
    <div class="ressources svelte-9oiej2"><h1 class="svelte-9oiej2">Ressources</h1></div>
    <div class="contactInfo svelte-9oiej2"><h1 class="svelte-9oiej2">Contact Info</h1></div></div>`;
    }
  })}`;
});
export {
  Layout as default
};
