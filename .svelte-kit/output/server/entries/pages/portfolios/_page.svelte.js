import { c as create_ssr_component, e as escape, n as null_to_empty, v as validate_component, d as each, f as subscribe } from "../../../chunks/index3.js";
import { o as obrPromptBoolean, b as selectedDashboardMenu } from "../../../chunks/store.js";
import { I as Icon } from "../../../chunks/Icon.js";
import { u as userArchetypes } from "../../../chunks/uidata.js";
var dashboardMenuList = /* @__PURE__ */ ((dashboardMenuList2) => {
  dashboardMenuList2["Home"] = "home";
  dashboardMenuList2["Dashboard"] = "Dashboard";
  dashboardMenuList2["Portfolio"] = "Portfolio";
  dashboardMenuList2["Account"] = "Account";
  dashboardMenuList2["Logout"] = "Logout";
  return dashboardMenuList2;
})(dashboardMenuList || {});
const OBRCard_svelte_svelte_type_style_lang = "";
const css$4 = {
  code: ".svelte-1l4jtza.svelte-1l4jtza::before,.svelte-1l4jtza.svelte-1l4jtza::after,.svelte-1l4jtza.svelte-1l4jtza{padding:0;margin:0;box-sizing:border-box}.notSupported.svelte-1l4jtza.svelte-1l4jtza{color:#86929c !important;font-weight:bold}.obr_card_notsupported.svelte-1l4jtza.svelte-1l4jtza:hover{cursor:not-allowed !important;border:solid 1px #86929c !important}.obr_card.svelte-1l4jtza.svelte-1l4jtza,.obr_card_notsupported.svelte-1l4jtza.svelte-1l4jtza{border-radius:6px;padding:1em;width:15vw;aspect-ratio:1/1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1em;transition:all 0.5s ease;border:solid 1px #86929c;position:relative;background-color:whitesmoke}.obr_card.svelte-1l4jtza.svelte-1l4jtza:hover,.obr_card_notsupported.svelte-1l4jtza.svelte-1l4jtza:hover{cursor:pointer;border:solid 2px #258ea8}.obr_card.svelte-1l4jtza h1.svelte-1l4jtza,.obr_card_notsupported.svelte-1l4jtza h1.svelte-1l4jtza{color:#05192a;position:absolute}.obr_card.svelte-1l4jtza p.svelte-1l4jtza,.obr_card_notsupported.svelte-1l4jtza p.svelte-1l4jtza{text-align:center;color:#86929c;position:absolute;top:60%}@media screen and (max-width: 1200px){.obr_card.svelte-1l4jtza.svelte-1l4jtza,.obr_card_notsupported.svelte-1l4jtza.svelte-1l4jtza{width:25vw;aspect-ratio:1/1}.obr_card.svelte-1l4jtza h1.svelte-1l4jtza,.obr_card_notsupported.svelte-1l4jtza h1.svelte-1l4jtza{color:#05192a;position:absolute}.obr_card.svelte-1l4jtza p.svelte-1l4jtza,.obr_card_notsupported.svelte-1l4jtza p.svelte-1l4jtza{text-align:center;color:#86929c;position:absolute;top:60%;font-size:0.8rem}}@media screen and (max-width: 600px){.obr_card.svelte-1l4jtza.svelte-1l4jtza,.obr_card_notsupported.svelte-1l4jtza.svelte-1l4jtza{width:40vw;aspect-ratio:1/1}.obr_card.svelte-1l4jtza h1.svelte-1l4jtza,.obr_card_notsupported.svelte-1l4jtza h1.svelte-1l4jtza{color:#05192a;position:absolute;font-size:0.8rem;margin-top:2em}.obr_card.svelte-1l4jtza p.svelte-1l4jtza,.obr_card_notsupported.svelte-1l4jtza p.svelte-1l4jtza{text-align:center;color:#86929c;position:absolute;top:60%;font-size:0.8rem;margin-top:1em}}",
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
  ) + " svelte-1l4jtza"}">${slots.default ? slots.default({}) : `
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
       <h1 class="${escape(null_to_empty(user.type == "Business" ? "notSupported" : ""), true) + " svelte-1l4jtza"}">${escape(user.title)}</h1>
       <p class="${escape(null_to_empty(user.type == "Business" ? "notSupported" : ""), true) + " svelte-1l4jtza"}">${escape(user.type == "Business" ? "Not supported yet" : user.content)}</p>

    `}
</div>`;
});
const OBRPrompt_svelte_svelte_type_style_lang = "";
const OBRLanding_svelte_svelte_type_style_lang = "";
const css$3 = {
  code: ".svelte-pigcts::before,.svelte-pigcts::after,.svelte-pigcts{padding:0;margin:0;box-sizing:border-box}.overlay_window.svelte-pigcts,.obr_landing.svelte-pigcts{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%)}.obr_landing.svelte-pigcts{width:50vw;height:60vh;padding:1em;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;border-radius:6px;transition:all 0.5s ease;background:rgba(255, 255, 255, 0.856)}.overlay_window.svelte-pigcts{width:100vw;height:100vh;background-color:rgba(5, 25, 42, 0.3490196078)}@media screen and (max-width: 1200px){.obr_landing.svelte-pigcts{width:90%}}@media screen and (max-width: 600px){.obr_landing.svelte-pigcts{width:90%}}",
  map: null
};
const OBRLanding = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$3);
  return `<div class="svelte-pigcts"><div class="overlay_window svelte-pigcts"></div>
    
    <div class="obr_landing svelte-pigcts">${each(userArchetypes, (user) => {
    return `${validate_component(OBRCard, "ObrCard").$$render($$result, { user }, {}, {})}`;
  })}</div>


</div>`;
});
const PortfolioGrid_svelte_svelte_type_style_lang = "";
const css$2 = {
  code: ".svelte-ucks1v::before,.svelte-ucks1v::after,.svelte-ucks1v{padding:0;margin:0;box-sizing:border-box}.portfolio_container.svelte-ucks1v{height:100%;width:82vw;background-color:#1b6f85;padding:1em}",
  map: null
};
const PortfolioGrid = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { rows } = $$props;
  if ($$props.rows === void 0 && $$bindings.rows && rows !== void 0)
    $$bindings.rows(rows);
  $$result.css.add(css$2);
  return `<div class="portfolio_container container mx-auto my-6 shadow px-10 py-7 svelte-ucks1v"><h2 class="text-3xl font-extrabold my-3 svelte-ucks1v">Portfolios</h2>
	<table class="min-w-full text-left svelte-ucks1v"><thead class="border-b border-slate-400 svelte-ucks1v"><tr class="svelte-ucks1v"><th class="text-semibold text-lg svelte-ucks1v">Portfolio </th>
				<th class="text-semibold text-lg svelte-ucks1v">ID</th>
				<th class="text-semibold text-lg svelte-ucks1v">Created (AsOf)</th></tr></thead>
		<tbody class="svelte-ucks1v">${each(rows, (row) => {
    return `<tr class="table-row border-b border-slate-400 svelte-ucks1v"><td class="table-cell svelte-ucks1v">${escape(row.portfolioName)}</td>
					<td class="table-cell svelte-ucks1v">${escape(row.portfolioId)}</td>
					<td class="table-cell svelte-ucks1v">${escape(row.portfolioAsOf)}</td>
				</tr>`;
  })}</tbody></table>
</div>`;
});
const Dashboard_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".svelte-zd2p13.svelte-zd2p13::before,.svelte-zd2p13.svelte-zd2p13::after,.svelte-zd2p13.svelte-zd2p13{padding:0;margin:0;box-sizing:border-box}.dashboard-container.svelte-zd2p13.svelte-zd2p13{background-color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:0}.dashboard-container.svelte-zd2p13 .dashboard-menu.svelte-zd2p13{width:98%;height:98%;padding:2em;border-radius:5px;background-color:#edfbfd;color:#1b6f85}",
  map: null
};
const Dashboard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $obrPromptBoolean, $$unsubscribe_obrPromptBoolean;
  let $selectedDashboardMenu, $$unsubscribe_selectedDashboardMenu;
  $$unsubscribe_obrPromptBoolean = subscribe(obrPromptBoolean, (value) => $obrPromptBoolean = value);
  $$unsubscribe_selectedDashboardMenu = subscribe(selectedDashboardMenu, (value) => $selectedDashboardMenu = value);
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  $$result.css.add(css$1);
  $$unsubscribe_obrPromptBoolean();
  $$unsubscribe_selectedDashboardMenu();
  return `


<div class="p-5 h-full w-screen dashboard-container svelte-zd2p13">${$obrPromptBoolean ? `${validate_component(OBRLanding, "ObrLanding").$$render($$result, {}, {}, {})}` : ``}
          ${$selectedDashboardMenu == dashboardMenuList.Home ? `<div class="dashboard-menu svelte-zd2p13">Home
                  <a href="/security/1" class="svelte-zd2p13">→✅</a></div>` : `${$selectedDashboardMenu == dashboardMenuList.Dashboard ? `<div class="dashboard-menu svelte-zd2p13">Dashboard
                 <a href="/security/2" class="svelte-zd2p13">→✅</a></div>` : `${$selectedDashboardMenu == dashboardMenuList.Portfolio ? `${validate_component(PortfolioGrid, "PortfolioGrid").$$render($$result, { rows: data.portfolioData }, {}, {})}` : `${$selectedDashboardMenu == dashboardMenuList.Account ? `<div class="dashboard-menu svelte-zd2p13">Account 
                 <a href="/security/2" class="svelte-zd2p13">→✅</a></div>` : `${$selectedDashboardMenu == dashboardMenuList.Logout ? `<div class="dashboard-menu svelte-zd2p13">Goodbye</div>` : ``}`}`}`}`}
</div>`;
});
const DashboardSideBar_svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-1r6fesj.svelte-1r6fesj::before,.svelte-1r6fesj.svelte-1r6fesj::after,.svelte-1r6fesj.svelte-1r6fesj{padding:0;margin:0;box-sizing:border-box}.dashboard-sidebar.svelte-1r6fesj.svelte-1r6fesj{background-color:#edfbfd;box-shadow:2px 2px 10px rgba(206, 206, 206, 0.034);width:20vw;display:grid;grid-template-columns:1fr;grid-template-rows:repeat(5, 50px);justify-content:center;align-items:center;justify-items:start;padding-top:2em}.dashboard-sidebar.svelte-1r6fesj .user-menu.svelte-1r6fesj{color:#1b6f85;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;margin:2em 1em 0 3em}.dashboard-sidebar.svelte-1r6fesj .user-menu-logout.svelte-1r6fesj{color:#1b6f85}@media screen and (max-width: 1200px){.dashboard-sidebar.svelte-1r6fesj.svelte-1r6fesj{width:35vw}}@media screen and (max-width: 600px){.dashboard-sidebar.svelte-1r6fesj.svelte-1r6fesj{display:flex;align-items:center}.dashboard-sidebar.svelte-1r6fesj .user-menu-logout.svelte-1r6fesj{padding:0}.dashboard-sidebar.svelte-1r6fesj div.svelte-1r6fesj{width:100%;margin-right:1em}.dashboard-sidebar.svelte-1r6fesj div span.svelte-1r6fesj{display:none}}",
  map: null
};
const DashboardSideBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `
<div class="w-1/4 p-5 flex flex-col gap-20 relative dashboard-sidebar svelte-1r6fesj"><div class="p-2 user-menu cursor-pointer svelte-1r6fesj">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "material-symbols:home",
      class: "user-menu-icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span class="svelte-1r6fesj">Home</span></div>
  <div class="p-2 user-menu cursor-pointer svelte-1r6fesj">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "ic:baseline-dashboard",
      class: "user-menu-icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span class="svelte-1r6fesj">Dashboard</span></div>
  <div class="p-2 user-menu gap-4 cursor-pointer svelte-1r6fesj">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:graph-new-bold",
      class: "align-bottom text-lg",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span class="svelte-1r6fesj">Portfolio</span></div>
  <div class="p-2 user-menu cursor-pointer svelte-1r6fesj">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "ant-design:setting-filled",
      class: "user-menu-icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span class="svelte-1r6fesj">Account</span></div>
  <div class="user-menu-logout user-menu cursor-pointer svelte-1r6fesj">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:logout-3-bold",
      class: "user-menu-icon",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
    <span class="svelte-1r6fesj">Logout</span></div>
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
