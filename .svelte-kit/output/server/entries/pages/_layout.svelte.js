import { g as get_store_value, c as create_ssr_component, a as add_attribute, e as escape, b as compute_slots, v as validate_component, d as each, f as subscribe, n as null_to_empty } from "../../chunks/index3.js";
import { w as writable } from "../../chunks/index2.js";
import { I as Icon } from "../../chunks/Icon.js";
import { s as sideBarURLText } from "../../chunks/uidata.js";
import { s as sideMenuStore } from "../../chunks/store.js";
const skeleton = "";
const themeSkeleton = "";
const app = "";
const stores = {};
function localStorageStore(key, initialValue, options) {
  options?.serializer ?? JSON;
  options?.storage ?? "local";
  if (!stores[key]) {
    const store = writable(initialValue, (set2) => {
    });
    const { subscribe: subscribe2, set } = store;
    stores[key] = {
      set(value) {
        set(value);
      },
      update(updater) {
        const value = updater(get_store_value(store));
        set(value);
      },
      subscribe: subscribe2
    };
  }
  return stores[key];
}
localStorageStore("modeOsPrefers", false);
localStorageStore("modeUserPrefers", void 0);
localStorageStore("modeCurrent", false);
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
const ProgressBar_svelte_svelte_type_style_lang = "";
const IconLink_svelte_svelte_type_style_lang = "";
const css$3 = {
  code: ".svelte-gtmgvl::before,.svelte-gtmgvl::after,.svelte-gtmgvl{padding:0;margin:0;box-sizing:border-box}.custom-icon.svelte-gtmgvl{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em}",
  map: null
};
const IconLink = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { iconName } = $$props;
  let { iconCss = "width: 25px; height: 25px;" } = $$props;
  if ($$props.iconName === void 0 && $$bindings.iconName && iconName !== void 0)
    $$bindings.iconName(iconName);
  if ($$props.iconCss === void 0 && $$bindings.iconCss && iconCss !== void 0)
    $$bindings.iconCss(iconCss);
  $$result.css.add(css$3);
  return `<div class="custom-icon svelte-gtmgvl">${validate_component(Icon, "Icon").$$render($$result, { icon: iconName, style: iconCss }, {}, {})}
${slots.default ? slots.default({}) : ``} 
</div>`;
});
const Navbar_svelte_svelte_type_style_lang = "";
const css$2 = {
  code: '.svelte-1b82b4g.svelte-1b82b4g::before,.svelte-1b82b4g.svelte-1b82b4g::after,.svelte-1b82b4g.svelte-1b82b4g{padding:0;margin:0;box-sizing:border-box}.navigation_bar.svelte-1b82b4g.svelte-1b82b4g{height:10vh;padding:1em;background-color:#0c3a46;display:flex;flex-direction:row;justify-content:space-between;align-items:center;gap:1em}.navigation_bar.svelte-1b82b4g .logo.svelte-1b82b4g{font-weight:bold;font-size:1.2rem;margin-left:3em;cursor:pointer;display:flex;flex-direction:center;justify-content:center;align-items:row;gap:0.5em}.navigation_bar.svelte-1b82b4g .navigation_links ul.svelte-1b82b4g{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;width:60vw}.navigation_bar.svelte-1b82b4g .navigation_links ul li.svelte-1b82b4g{padding:0.6em 1em;position:relative;cursor:pointer;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em}.navigation_bar.svelte-1b82b4g .navigation_links ul li.svelte-1b82b4g:not(:first-child)::before{content:"";width:0;height:2px;background-color:#1b6f85;position:absolute;bottom:-1%;border-radius:6px;left:0%;transform:translateX(-50%);transition:width 0.5s ease-in-out, left 0.5s ease-in-out}.navigation_bar.svelte-1b82b4g .navigation_links ul li.svelte-1b82b4g:hover::before{width:95%;left:50%}.navigation_bar.svelte-1b82b4g .navigation_links ul li a.svelte-1b82b4g{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:0.5em}.navigation_bar.svelte-1b82b4g .navigation_links ul li.svelte-1b82b4g:first-child{border-radius:50px;background-color:#7cd2ba;transition:all 0.5s ease-in-out;color:#0c3a46;font-weight:bold}.navigation_bar.svelte-1b82b4g .navigation_links ul li.svelte-1b82b4g:first-child:hover{background-color:#1b6f85;color:whitesmoke}.navigation_bar.svelte-1b82b4g .navigation_links ul li.svelte-1b82b4g:last-child{display:flex;flex-direction:center;justify-content:center;align-items:row;gap:0.4em;margin-left:1em}.navigation_bar.svelte-1b82b4g .contact.svelte-1b82b4g{cursor:pointer}@media screen and (max-width: 1200px){.navigation_bar.svelte-1b82b4g.svelte-1b82b4g{display:none}.hamburger_nav .navigation_bar.svelte-1b82b4g .logo.svelte-1b82b4g{width:100%;display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:1em}.hamburger_nav .navigation_bar.svelte-1b82b4g .navigation_links.svelte-1b82b4g{width:100%;height:50vh;margin-top:2em}.hamburger_nav .navigation_bar.svelte-1b82b4g .navigation_links ul.svelte-1b82b4g{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1em;width:20vw}.hamburger_nav .navigation_bar.svelte-1b82b4g .navigation_links ul li.svelte-1b82b4g{width:100%;display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:0.4em}.hamburger_nav .navigation_bar.svelte-1b82b4g .navigation_links ul li.svelte-1b82b4g:last-child{display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:0.4em;margin-left:0}}@media screen and (max-width: 600px){.hamburger_nav .navigation_bar.svelte-1b82b4g .logo.svelte-1b82b4g{width:100%;display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:1em}.hamburger_nav .navigation_bar.svelte-1b82b4g .navigation_links.svelte-1b82b4g{width:100%;height:50vh;margin-top:2em}.hamburger_nav .navigation_bar.svelte-1b82b4g .navigation_links ul.svelte-1b82b4g{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1em;margin:0 auto;width:30vw}.hamburger_nav .navigation_bar.svelte-1b82b4g .navigation_links ul li.svelte-1b82b4g{width:100%;display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:0.4em}.hamburger_nav .navigation_bar.svelte-1b82b4g .navigation_links ul li.svelte-1b82b4g:last-child{display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:0.4em;margin-left:0}}',
  map: null
};
const Navbar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$2);
  return `
    <div class="navigation_bar svelte-1b82b4g"><div class="logo svelte-1b82b4g">${validate_component(IconLink, "IconLink").$$render(
    $$result,
    {
      iconName: "material-symbols:finance-mode"
    },
    {},
    {
      default: () => {
        return `Fintekkers
        `;
      }
    }
  )}</div>
      <div class="navigation_links svelte-1b82b4g"><ul class="svelte-1b82b4g">${each(sideBarURLText, (urlText) => {
    return `<li class="svelte-1b82b4g">${validate_component(IconLink, "IconLink").$$render($$result, { iconName: urlText.icon }, {}, {})}
            <a${add_attribute("href", urlText.url, 0)} class="svelte-1b82b4g">${escape(urlText.text)}</a>
           </li>`;
  })}</ul></div>
      <div class="contact svelte-1b82b4g">${validate_component(IconLink, "IconLink").$$render($$result, { iconName: "akar-icons:price-cut" }, {}, {
    default: () => {
      return `Contact Us
        `;
    }
  })}</div>
    </div>`;
});
const SideBarNav_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: '.svelte-169c8uj.svelte-169c8uj::before,.svelte-169c8uj.svelte-169c8uj::after,.svelte-169c8uj.svelte-169c8uj{padding:0;margin:0;box-sizing:border-box}.glass_background.svelte-169c8uj.svelte-169c8uj{border:solid 1px #86929c;backdrop-filter:blur(13px) saturate(180%);-webkit-backdrop-filter:blur(13px) saturate(180%);background-color:rgba(11, 46, 54, 0.4941176471);border-radius:12px;border:1px solid rgba(90, 150, 163, 0.4941176471)}.debug.svelte-169c8uj.svelte-169c8uj{border:solid 1px red}.notSupported.svelte-169c8uj.svelte-169c8uj{color:#86929c !important;font-weight:bold}.centerAbsolute.svelte-169c8uj.svelte-169c8uj{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%)}.body-cover.svelte-169c8uj.svelte-169c8uj{background-color:#0c3a46;position:absolute}.button.svelte-169c8uj.svelte-169c8uj{padding:0.5rem 1rem;border-radius:5px;background-color:#258ea8}.navigation_bar.svelte-169c8uj.svelte-169c8uj{height:10vh;padding:1em;background-color:#0c3a46;display:flex;flex-direction:row;justify-content:space-between;align-items:center;gap:1em}.navigation_bar.svelte-169c8uj .logo.svelte-169c8uj{font-weight:bold;font-size:1.2rem;margin-left:3em;cursor:pointer;display:flex;flex-direction:center;justify-content:center;align-items:row;gap:0.5em}.navigation_bar.svelte-169c8uj .navigation_links ul.svelte-169c8uj{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;width:60vw}.navigation_bar.svelte-169c8uj .navigation_links ul li.svelte-169c8uj{padding:0.6em 1em;position:relative;cursor:pointer;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em}.navigation_bar.svelte-169c8uj .navigation_links ul li.svelte-169c8uj:not(:first-child)::before{content:"";width:0;height:2px;background-color:#1b6f85;position:absolute;bottom:-1%;border-radius:6px;left:0%;transform:translateX(-50%);transition:width 0.5s ease-in-out, left 0.5s ease-in-out}.navigation_bar.svelte-169c8uj .navigation_links ul li.svelte-169c8uj:hover::before{width:95%;left:50%}.navigation_bar.svelte-169c8uj .navigation_links ul li a.svelte-169c8uj{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:0.5em}.navigation_bar.svelte-169c8uj .navigation_links ul li.svelte-169c8uj:first-child{border-radius:50px;background-color:#7cd2ba;transition:all 0.5s ease-in-out;color:#0c3a46;font-weight:bold}.navigation_bar.svelte-169c8uj .navigation_links ul li.svelte-169c8uj:first-child:hover{background-color:#1b6f85;color:whitesmoke}.navigation_bar.svelte-169c8uj .navigation_links ul li.svelte-169c8uj:last-child{display:flex;flex-direction:center;justify-content:center;align-items:row;gap:0.4em;margin-left:1em}.navigation_bar.svelte-169c8uj .contact.svelte-169c8uj{cursor:pointer}.form.svelte-169c8uj.svelte-169c8uj{height:100%}.hamburger_nav.svelte-169c8uj.svelte-169c8uj{display:none}.hamburger_btn.svelte-169c8uj.svelte-169c8uj{display:none;padding:1em}.sidebar-navigation.svelte-169c8uj.svelte-169c8uj{display:grid;grid-template-columns:1fr;grid-template-rows:repeat(5, 100px)}.sidebar-navigation.svelte-169c8uj div.svelte-169c8uj:nth-child(n){grid-column:1/-1;cursor:pointer;margin:0 auto}.sidebar-navigation.svelte-169c8uj .logo.svelte-169c8uj{grid-row:2/2;display:flex;flex-direction:row;justify-content:flex-start;align-items:flex-start;gap:1em;font-weight:bold}.sidebar-navigation.svelte-169c8uj .navigation_links.svelte-169c8uj{grid-row:3/5}.sidebar-navigation.svelte-169c8uj .navigation_links ul.svelte-169c8uj{display:grid;grid-template-columns:1fr;grid-template-rows:repeat(5, 50px)}.sidebar-navigation.svelte-169c8uj .navigation_links ul li.svelte-169c8uj{display:flex;flex-direction:row;justify-content:flex-start;align-items:flex-start;gap:1em}.sidebar-navigation.svelte-169c8uj .contact.svelte-169c8uj{grid-row:6/6;display:flex;flex-direction:row;justify-content:flex-start;align-items:flex-start;gap:1em}@media screen and (max-width: 1200px){.navigation_bar.svelte-169c8uj.svelte-169c8uj{display:none}.hamburger_nav.svelte-169c8uj.svelte-169c8uj{display:block;width:30vw;height:100%;position:absolute;z-index:3;top:0;background-color:#0c3a46;transition:all 0.2s ease-in-out}.hamburger_nav.svelte-169c8uj .navigation_bar .logo.svelte-169c8uj{width:100%;display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:1em}.hamburger_nav.svelte-169c8uj .navigation_bar .navigation_links.svelte-169c8uj{width:100%;height:50vh;margin-top:2em}.hamburger_nav.svelte-169c8uj .navigation_bar .navigation_links ul.svelte-169c8uj{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1em;width:20vw}.hamburger_nav.svelte-169c8uj .navigation_bar .navigation_links ul li.svelte-169c8uj{width:100%;display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:0.4em}.hamburger_nav.svelte-169c8uj .navigation_bar .navigation_links ul li.svelte-169c8uj:last-child{display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:0.4em;margin-left:0}.hamburger_btn.svelte-169c8uj.svelte-169c8uj{display:block;position:absolute;right:0;margin:1em;z-index:100}.hidden.svelte-169c8uj.svelte-169c8uj{right:-100%;display:none}.show.svelte-169c8uj.svelte-169c8uj{right:0%}}@media screen and (max-width: 600px){.hamburger_nav.svelte-169c8uj.svelte-169c8uj{width:100vw;background-color:#0c3a46}.hamburger_nav.svelte-169c8uj .navigation_bar .logo.svelte-169c8uj{width:100%;font-size:1.5rem;font-weight:bold;display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:1em}.hamburger_nav.svelte-169c8uj .navigation_bar .navigation_links.svelte-169c8uj{width:100%;height:50vh;margin-top:2em}.hamburger_nav.svelte-169c8uj .navigation_bar .navigation_links ul.svelte-169c8uj{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:3em;margin:0 auto;width:30vw}.hamburger_nav.svelte-169c8uj .navigation_bar .navigation_links ul li.svelte-169c8uj{width:100%;display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:0.4em}.hamburger_nav.svelte-169c8uj .navigation_bar .navigation_links ul li.svelte-169c8uj:last-child{display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:0.4em;margin-left:0}.hidden.svelte-169c8uj.svelte-169c8uj{right:-100%;display:none}.show.svelte-169c8uj.svelte-169c8uj{right:0%}}',
  map: null
};
const SideBarNav = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $sideMenuStore, $$unsubscribe_sideMenuStore;
  $$unsubscribe_sideMenuStore = subscribe(sideMenuStore, (value) => $sideMenuStore = value);
  $$result.css.add(css$1);
  $$unsubscribe_sideMenuStore();
  return `
  <div class="${escape(null_to_empty(`hamburger_nav ${$sideMenuStore ? "show" : "hidden"}`), true) + " svelte-169c8uj"}"><div class="sidebar-navigation svelte-169c8uj"><div class="logo svelte-169c8uj">${validate_component(IconLink, "IconLink").$$render(
    $$result,
    {
      iconName: "material-symbols:finance-mode"
    },
    {},
    {
      default: () => {
        return `Fintekkers
        `;
      }
    }
  )}</div>

      <div class="navigation_links svelte-169c8uj"><ul class="svelte-169c8uj">${each(sideBarURLText, (urlText) => {
    return `<li class="svelte-169c8uj">${validate_component(IconLink, "IconLink").$$render($$result, { iconName: urlText.icon }, {}, {})}        
                <a${add_attribute("href", urlText.url, 0)} class="svelte-169c8uj">${escape(urlText.text)}</a>
             </li>`;
  })}</ul></div>

      <div class="contact svelte-169c8uj">${validate_component(IconLink, "IconLink").$$render($$result, { iconName: "akar-icons:price-cut" }, {}, {
    default: () => {
      return `Contact Us
        `;
    }
  })}</div></div></div>
  <div class="hamburger_btn svelte-169c8uj">${$sideMenuStore ? `<button class="close_btn svelte-169c8uj">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "ic:outline-close",
      style: "width: 35px; height: 35px;"
    },
    {},
    {}
  )}</button>` : `<button class="open_btn svelte-169c8uj">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "mdi:hamburger-menu",
      style: "width: 35px; height: 35px;"
    },
    {},
    {}
  )}</button>`}
  </div>`;
});
const _layout_svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-1wvmado::before,.svelte-1wvmado::after,.svelte-1wvmado{padding:0;margin:0;box-sizing:border-box}",
  map: null
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  let { form } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0)
    $$bindings.form(form);
  $$result.css.add(css);
  return `
${validate_component(AppShell, "AppShell").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(SideBarNav, "SideBarNav").$$render($$result, {}, {}, {})}
  ${validate_component(Navbar, "Navbar").$$render($$result, {}, {}, {})}
  ${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
export {
  Layout as default
};
