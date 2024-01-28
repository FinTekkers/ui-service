import { c as create_ssr_component, e as escape, n as null_to_empty, v as validate_component, d as each, f as subscribe } from "../../../chunks/index3.js";
import { I as Icon, b as booleanStore, s as selectedDashboardMenu, d as dashboardMenuList } from "../../../chunks/store.js";
import { u as userArchetypeData, d as dashboardMenuData } from "../../../chunks/uidata.js";
const OBRCard_svelte_svelte_type_style_lang = "";
const css$4 = {
  code: ".svelte-1llaivi.svelte-1llaivi::before,.svelte-1llaivi.svelte-1llaivi::after,.svelte-1llaivi.svelte-1llaivi{padding:0;margin:0;box-sizing:border-box}.notSupported.svelte-1llaivi.svelte-1llaivi{color:#86929c !important;font-weight:bold}.obr_card_notsupported.svelte-1llaivi.svelte-1llaivi:hover{cursor:not-allowed !important;border:solid 1px #86929c !important}.obr_card.svelte-1llaivi.svelte-1llaivi,.obr_card_notsupported.svelte-1llaivi.svelte-1llaivi{border-radius:6px;padding:1em;width:15vw;aspect-ratio:1/1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1em;transition:all 0.5s ease;border:solid 1px #86929c;position:relative;background-color:whitesmoke}.obr_card.svelte-1llaivi.svelte-1llaivi:hover,.obr_card_notsupported.svelte-1llaivi.svelte-1llaivi:hover{cursor:pointer;border:solid 2px #258ea8}.obr_card.svelte-1llaivi h1.svelte-1llaivi,.obr_card_notsupported.svelte-1llaivi h1.svelte-1llaivi{color:#05192a;position:absolute}.obr_card.svelte-1llaivi .svelte-1llaivi:is(p),.obr_card_notsupported.svelte-1llaivi .svelte-1llaivi:is(p){text-align:center;color:#86929c;position:absolute;top:60%}@media screen and (max-width: 1200px){.obr_card.svelte-1llaivi.svelte-1llaivi,.obr_card_notsupported.svelte-1llaivi.svelte-1llaivi{width:25vw;aspect-ratio:1/1}.obr_card.svelte-1llaivi h1.svelte-1llaivi,.obr_card_notsupported.svelte-1llaivi h1.svelte-1llaivi{color:#05192a;position:absolute}.obr_card.svelte-1llaivi .svelte-1llaivi:is(p),.obr_card_notsupported.svelte-1llaivi .svelte-1llaivi:is(p){text-align:center;color:#86929c;position:absolute;top:60%;font-size:0.8rem}}@media screen and (max-width: 600px){.obr_card.svelte-1llaivi.svelte-1llaivi,.obr_card_notsupported.svelte-1llaivi.svelte-1llaivi{width:40vw;aspect-ratio:1/1}.obr_card.svelte-1llaivi h1.svelte-1llaivi,.obr_card_notsupported.svelte-1llaivi h1.svelte-1llaivi{color:#05192a;position:absolute;font-size:0.8rem;margin-top:2em}.obr_card.svelte-1llaivi .svelte-1llaivi:is(p),.obr_card_notsupported.svelte-1llaivi .svelte-1llaivi:is(p){text-align:center;color:#86929c;position:absolute;top:60%;font-size:0.8rem;margin-top:1em}}",
  map: null
};
const OBRCard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { user } = $$props;
  if ($$props.user === void 0 && $$bindings.user && user !== void 0)
    $$bindings.user(user);
  $$result.css.add(css$4);
  return `<div class="${escape(
    null_to_empty(user.type == "Business" ? "obr_card_notsupported" : "obr_card"),
    true
  ) + " svelte-1llaivi"}">${slots.default ? slots.default({}) : `
     ${user.type == "Business" ? `${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:user-linear",
      style: "width:50px;height:50px; color:#cccccc; position:absolute; top:20px",
      class: "icon"
    },
    {},
    {}
  )}` : `${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:user-linear",
      style: "width:50px;height:50px; color:#1b6f85; position:absolute; top:20px",
      class: "icon"
    },
    {},
    {}
  )}`}
       <h1 class="${escape(null_to_empty(user.type == "Business" ? "notSupported" : ""), true) + " svelte-1llaivi"}">${escape(user.title)}</h1>
       <p class="${escape(null_to_empty(user.type == "Business" ? "notSupported" : ""), true) + " svelte-1llaivi"}">${escape(user.type == "Business" ? "Not supported yet" : user.content)}</p>

    `}
</div>`;
});
const OBRLanding_svelte_svelte_type_style_lang = "";
const css$3 = {
  code: ".svelte-1i8ctt6::before,.svelte-1i8ctt6::after,.svelte-1i8ctt6{padding:0;margin:0;box-sizing:border-box}.overlay_window.svelte-1i8ctt6,.obr_landing.svelte-1i8ctt6{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%)}.obr_landing.svelte-1i8ctt6{width:50vw;height:60vh;padding:1em;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;border-radius:6px;transition:all 0.5s ease;background:rgba(255, 255, 255, 0.856)}.overlay_window.svelte-1i8ctt6{width:100vw;height:100vh;background-color:rgba(5, 25, 42, 0.3490196078)}@media screen and (max-width: 1200px){.obr_landing.svelte-1i8ctt6{width:90%}}@media screen and (max-width: 600px){.obr_landing.svelte-1i8ctt6{width:90%}}",
  map: null
};
const OBRLanding = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$3);
  return `<div class="svelte-1i8ctt6"><div class="overlay_window svelte-1i8ctt6"></div>
    
    <div class="obr_landing svelte-1i8ctt6">${each(userArchetypeData, (user) => {
    return `${validate_component(OBRCard, "ObrCard").$$render($$result, { user }, {}, {})}`;
  })}</div>


</div>`;
});
const PortfolioGrid_svelte_svelte_type_style_lang = "";
const css$2 = {
  code: ".svelte-k8f2th::before,.svelte-k8f2th::after,.svelte-k8f2th{padding:0;margin:0;box-sizing:border-box}.portfolio_container.svelte-k8f2th{height:100%;width:82vw;background-color:#1b6f85;padding:1em}",
  map: null
};
const PortfolioGrid = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { rows } = $$props;
  if ($$props.rows === void 0 && $$bindings.rows && rows !== void 0)
    $$bindings.rows(rows);
  $$result.css.add(css$2);
  return `<div class="portfolio_container container mx-auto my-6 shadow px-10 py-7 svelte-k8f2th"><h2 class="text-3xl font-extrabold my-3 svelte-k8f2th">Portfolios</h2>
	<table class="min-w-full text-left svelte-k8f2th"><thead class="border-b border-slate-400 svelte-k8f2th"><tr class="svelte-k8f2th"><th class="text-semibold text-lg svelte-k8f2th">Portfolio </th>
				<th class="text-semibold text-lg svelte-k8f2th">ID</th>
				<th class="text-semibold text-lg svelte-k8f2th">Created (AsOf)</th></tr></thead>
		<tbody class="svelte-k8f2th">${each(rows, (row) => {
    return `<tr class="table-row border-b border-slate-400 svelte-k8f2th"><td class="table-cell svelte-k8f2th">${escape(row.portfolioName)}</td>
					<td class="table-cell svelte-k8f2th">${escape(row.portfolioId)}</td>
					<td class="table-cell svelte-k8f2th">${escape(row.portfolioAsOf)}</td>
				</tr>`;
  })}</tbody></table>
</div>`;
});
const Dashboard_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".svelte-3xny49.svelte-3xny49::before,.svelte-3xny49.svelte-3xny49::after,.svelte-3xny49.svelte-3xny49{padding:0;margin:0;box-sizing:border-box}.navigation_bar .navigation_links .svelte-3xny49:is(ul) li a.svelte-3xny49{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:0.5em}.dashboard-container.svelte-3xny49.svelte-3xny49{background-color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:0}.dashboard-container.svelte-3xny49 .dashboard-menu.svelte-3xny49{width:98%;height:98%;padding:2em;border-radius:5px;background-color:#edfbfd;color:#1b6f85}",
  map: null
};
const Dashboard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $booleanStore, $$unsubscribe_booleanStore;
  let $selectedDashboardMenu, $$unsubscribe_selectedDashboardMenu;
  $$unsubscribe_booleanStore = subscribe(booleanStore, (value) => $booleanStore = value);
  $$unsubscribe_selectedDashboardMenu = subscribe(selectedDashboardMenu, (value) => $selectedDashboardMenu = value);
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  $$result.css.add(css$1);
  $$unsubscribe_booleanStore();
  $$unsubscribe_selectedDashboardMenu();
  return `<div class="p-5 h-full w-screen dashboard-container svelte-3xny49">${$booleanStore.IS_OBR_PROMPT_SHOWING ? `${validate_component(OBRLanding, "ObrLanding").$$render($$result, {}, {}, {})}` : `${escape(console.log("waiting for onboarding component"))}`}

          ${$selectedDashboardMenu == dashboardMenuList.HOME ? `<div class="dashboard-menu svelte-3xny49">Home
                  <a href="/security/1" class="svelte-3xny49">→✅</a></div>` : `${$selectedDashboardMenu == dashboardMenuList.DASHBOARD ? `<div class="dashboard-menu svelte-3xny49">Dashboard
                 <a href="/security/2" class="svelte-3xny49">→✅</a></div>` : `${$selectedDashboardMenu == dashboardMenuList.PORTFOLIO ? `${validate_component(PortfolioGrid, "PortfolioGrid").$$render($$result, { rows: data.portfolioData }, {}, {})}` : `${$selectedDashboardMenu == dashboardMenuList.ACCOUNT ? `<div class="dashboard-menu svelte-3xny49">Account 
                 <a href="/security/2" class="svelte-3xny49">→✅</a></div>` : `${$selectedDashboardMenu == dashboardMenuList.LOGOUT ? `<div class="dashboard-menu svelte-3xny49">Goodbye</div>` : ``}`}`}`}`}
</div>`;
});
const DashboardSideBar_svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-18053s0.svelte-18053s0::before,.svelte-18053s0.svelte-18053s0::after,.svelte-18053s0.svelte-18053s0{padding:0;margin:0;box-sizing:border-box}.dashboard-sidebar.svelte-18053s0.svelte-18053s0{background-color:#edfbfd;box-shadow:2px 2px 10px rgba(206, 206, 206, 0.034);width:20vw;display:grid;grid-template-columns:1fr;grid-template-rows:repeat(5, 50px);justify-content:center;align-items:center;justify-items:start;padding-top:2em}.dashboard-sidebar.svelte-18053s0 .user-menu.svelte-18053s0{color:#1b6f85;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;margin:2em 1em 0 3em}.dashboard-sidebar.svelte-18053s0 .user-menu-logout.svelte-18053s0{color:#1b6f85}@media screen and (max-width: 1200px){.dashboard-sidebar.svelte-18053s0.svelte-18053s0{width:35vw}}@media screen and (max-width: 600px){.dashboard-sidebar.svelte-18053s0.svelte-18053s0{display:flex;align-items:center}.dashboard-sidebar.svelte-18053s0 .user-menu-logout.svelte-18053s0{padding:0}.dashboard-sidebar.svelte-18053s0 div.svelte-18053s0{width:100%;margin-right:1em}.dashboard-sidebar.svelte-18053s0 div .svelte-18053s0:is(span){display:none}}",
  map: null
};
const DashboardSideBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<div class="w-1/4 p-5 flex flex-col gap-20 relative dashboard-sidebar svelte-18053s0">${each(Object.entries(dashboardMenuData), ([_menukey, menuValue]) => {
    return `<div class="p-2 user-menu cursor-pointer svelte-18053s0">${validate_component(Icon, "Icon").$$render(
      $$result,
      {
        icon: menuValue.iconName,
        class: "user-menu-icon",
        style: menuValue.style
      },
      {},
      {}
    )}
    <span class="svelte-18053s0">${escape(menuValue.menuName)}</span>
  </div>`;
  })}

  <div class="user-menu-logout user-menu cursor-pointer svelte-18053s0">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:logout-3-bold",
      class: "user-menu-icon",
      style: "width: 20px; height: 20px;"
    },
    {},
    {}
  )}
    <span class="svelte-18053s0">Logout</span></div>
</div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  return `

<div class="w-screen h-full flex">${validate_component(DashboardSideBar, "DashboardSideBar").$$render($$result, {}, {}, {})}
  ${validate_component(Dashboard, "Dashboard").$$render($$result, { data }, {}, {})}</div>`;
});
export {
  Page as default
};
