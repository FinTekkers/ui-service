import { c as create_ssr_component, d as subscribe, f as createEventDispatcher, e as escape, v as validate_component, g as each } from "../../chunks/index3.js";
import "../../chunks/ProgressBar.svelte_svelte_type_style_lang.js";
import { w as writable } from "../../chunks/index2.js";
import { I as Icon } from "../../chunks/Icon.js";
const storeHighlightJs = writable(void 0);
const cBase = "overflow-hidden shadow";
const cHeader = "text-xs text-white/50 uppercase flex justify-between items-center p-2 pl-4";
const cPre = "whitespace-pre-wrap break-all p-4 pt-1";
function languageFormatter(lang) {
  if (lang === "js")
    return "javascript";
  if (lang === "ts")
    return "typescript";
  return lang;
}
const CodeBlock = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesBase;
  let $storeHighlightJs, $$unsubscribe_storeHighlightJs;
  $$unsubscribe_storeHighlightJs = subscribe(storeHighlightJs, (value) => $storeHighlightJs = value);
  createEventDispatcher();
  let { language = "plaintext" } = $$props;
  let { code = "" } = $$props;
  let { lineNumbers = false } = $$props;
  let { background = "bg-neutral-900/90" } = $$props;
  let { blur = "" } = $$props;
  let { text = "text-sm" } = $$props;
  let { color = "text-white" } = $$props;
  let { rounded = "rounded-container-token" } = $$props;
  let { shadow = "shadow" } = $$props;
  let { button = "btn btn-sm variant-soft !text-white" } = $$props;
  let { buttonLabel = "Copy" } = $$props;
  let { buttonCopied = "👍" } = $$props;
  let formatted = false;
  let displayCode = code;
  if ($$props.language === void 0 && $$bindings.language && language !== void 0)
    $$bindings.language(language);
  if ($$props.code === void 0 && $$bindings.code && code !== void 0)
    $$bindings.code(code);
  if ($$props.lineNumbers === void 0 && $$bindings.lineNumbers && lineNumbers !== void 0)
    $$bindings.lineNumbers(lineNumbers);
  if ($$props.background === void 0 && $$bindings.background && background !== void 0)
    $$bindings.background(background);
  if ($$props.blur === void 0 && $$bindings.blur && blur !== void 0)
    $$bindings.blur(blur);
  if ($$props.text === void 0 && $$bindings.text && text !== void 0)
    $$bindings.text(text);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0)
    $$bindings.color(color);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0)
    $$bindings.rounded(rounded);
  if ($$props.shadow === void 0 && $$bindings.shadow && shadow !== void 0)
    $$bindings.shadow(shadow);
  if ($$props.button === void 0 && $$bindings.button && button !== void 0)
    $$bindings.button(button);
  if ($$props.buttonLabel === void 0 && $$bindings.buttonLabel && buttonLabel !== void 0)
    $$bindings.buttonLabel(buttonLabel);
  if ($$props.buttonCopied === void 0 && $$bindings.buttonCopied && buttonCopied !== void 0)
    $$bindings.buttonCopied(buttonCopied);
  {
    if ($storeHighlightJs !== void 0) {
      displayCode = $storeHighlightJs.highlight(code, { language }).value.trim();
      formatted = true;
    }
  }
  {
    if (lineNumbers) {
      displayCode = displayCode.replace(/^/gm, () => {
        return '<span class="line"></span>	';
      });
      formatted = true;
    }
  }
  classesBase = `${cBase} ${background} ${blur} ${text} ${color} ${rounded} ${shadow} ${$$props.class ?? ""}`;
  $$unsubscribe_storeHighlightJs();
  return `
${language && code ? `<div class="${"codeblock " + escape(classesBase, true)}" data-testid="codeblock">
	<header class="${"codeblock-header " + escape(cHeader, true)}">
		<span class="codeblock-language">${escape(languageFormatter(language))}</span>
		
		<button class="${"codeblock-btn " + escape(button, true)}">${escape(buttonLabel)}</button></header>
	
	<pre class="${"codeblock-pre " + escape(cPre, true)}"><code class="${"codeblock-code language-" + escape(language, true) + " lineNumbers"}">${formatted ? `<!-- HTML_TAG_START -->${displayCode}<!-- HTML_TAG_END -->` : `${escape(code.trim())}`}</code></pre></div>` : ``}`;
});
const OBRCard_svelte_svelte_type_style_lang = "";
const css$5 = {
  code: ".svelte-1u1112w.svelte-1u1112w::before,.svelte-1u1112w.svelte-1u1112w::after,.svelte-1u1112w.svelte-1u1112w{padding:0;margin:0;box-sizing:border-box}.obr_card.svelte-1u1112w.svelte-1u1112w{border-radius:6px;padding:1em;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1em;transition:all 0.5s ease;border:solid 1px #86929c}.obr_card.svelte-1u1112w.svelte-1u1112w:hover{cursor:pointer;border:solid 2px #258ea8}.obr_card.svelte-1u1112w h1.svelte-1u1112w{color:#05192a}.obr_card.svelte-1u1112w p.svelte-1u1112w{text-align:center;color:#86929c}",
  map: null
};
const OBRCard = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { user } = $$props;
  if ($$props.user === void 0 && $$bindings.user && user !== void 0)
    $$bindings.user(user);
  $$result.css.add(css$5);
  return `<div class="obr_card svelte-1u1112w">${slots.content ? slots.content({}) : `
       ${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:user-linear",
      style: "width:50px;height:50px; color:#1b6f85",
      class: "icon"
    },
    {},
    {}
  )}
       <h1 class="svelte-1u1112w">${escape(user.title)}</h1>
       <p class="svelte-1u1112w">${escape(user.content)}</p>
    `}
</div>`;
});
const userArchetypes = [
  {
    title: "Business user",
    content: "You are here to save money",
    link: "Business landing page"
  },
  {
    title: "Engineers",
    content: "You want to develop a product",
    link: "Engineer landing page"
  }
];
const OBRLanding_svelte_svelte_type_style_lang = "";
const css$4 = {
  code: ".svelte-247yg9::before,.svelte-247yg9::after,.svelte-247yg9{padding:0;margin:0;box-sizing:border-box}.obr_landing.svelte-247yg9{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%)}.obr_landing.svelte-247yg9{width:50vw;height:50vh;padding:1em;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;background-color:whitesmoke;border-radius:6px;transition:all 0.5s ease}",
  map: null
};
const OBRLanding = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$4);
  return `<div class="obr_landing svelte-247yg9">${each(userArchetypes, (user) => {
    return `${validate_component(OBRCard, "ObrCard").$$render($$result, { user }, {}, {})}`;
  })}
</div>`;
});
const LandingSection_svelte_svelte_type_style_lang = "";
const css$3 = {
  code: ".svelte-4bwxzn.svelte-4bwxzn::before,.svelte-4bwxzn.svelte-4bwxzn::after,.svelte-4bwxzn.svelte-4bwxzn{padding:0;margin:0;box-sizing:border-box}.Intro_section.svelte-4bwxzn .intro_description button.svelte-4bwxzn{padding:0.5rem 1rem;border-radius:5px;background-color:#258ea8}.Intro_section.svelte-4bwxzn.svelte-4bwxzn{width:100%;height:50vh;padding:0 15em;display:flex;flex-direction:center;justify-content:center;align-items:row;gap:1em}.Intro_section.svelte-4bwxzn div.svelte-4bwxzn:nth-child(n){width:50%;padding:1em;margin-top:2em}.Intro_section.svelte-4bwxzn .intro_description.svelte-4bwxzn{display:grid}.Intro_section.svelte-4bwxzn .intro_description h1.svelte-4bwxzn{font-size:2rem}.Intro_section.svelte-4bwxzn .intro_description p.svelte-4bwxzn{width:100%}.Intro_section.svelte-4bwxzn .intro_description button.svelte-4bwxzn{width:20vw}.intro_visualiser.svelte-4bwxzn.svelte-4bwxzn{display:grid;gap:1em}@media screen and (max-width: 1200px){.Intro_section.svelte-4bwxzn.svelte-4bwxzn{display:grid;gap:1em;height:-moz-max-content;height:max-content;padding-bottom:2em}.Intro_section.svelte-4bwxzn div.svelte-4bwxzn:nth-child(n){width:80vw}.Intro_section.svelte-4bwxzn div.svelte-4bwxzn:nth-child(1){text-align:center}.Intro_section.svelte-4bwxzn .intro_description.svelte-4bwxzn{gap:1.5em}.Intro_section.svelte-4bwxzn .intro_description button.svelte-4bwxzn{width:50vw;margin:0 auto}}@media screen and (max-width: 600px){.Intro_section.svelte-4bwxzn.svelte-4bwxzn{height:100%;padding-bottom:2em}}",
  map: null
};
const LandingSection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$3);
  return `<div class="Intro_section svelte-4bwxzn">${validate_component(OBRLanding, "ObrLanding").$$render($$result, {}, {}, {})}
    <div class="intro_description svelte-4bwxzn"><h1 class="svelte-4bwxzn">Welcome to Fintekkers</h1>
        <p class="svelte-4bwxzn">Get started with Fintekkers instantly! Fintekkers platform provides
            you all the APIs you need to build your own fintech product, or
            solve your business opportunities at miminum cost.
        </p>
        <button class="svelte-4bwxzn">Try now</button></div>
    <div class="intro_visualiser svelte-4bwxzn">Install Fintekkers client libraries:
        ${validate_component(CodeBlock, "CodeBlock").$$render(
    $$result,
    {
      language: "ts",
      code: `
          npm i @fintekkers/ledger-models
        `
    },
    {},
    {}
  )}

        Make your first API call:

        ${validate_component(CodeBlock, "CodeBlock").$$render(
    $$result,
    {
      language: "ts",
      code: `
// Model Utils
import { FieldProto } from '../../../fintekkers/models/position/field_pb';
import * as uuid from '../../models/utils/uuid';
import * as dt from '../../models/utils/datetime';

//Requests & Services
import { PortfolioService } from './PortfolioService';

const now = dt.ZonedDateTime.now();

const portfolioService = new PortfolioService();

var searchResults = await portfolioService.searchPortfolio(now.toProto(), new PositionFilter().addEqualsFilter(FieldProto.PORTFOLIO_NAME, 'Federal Reserve SOMA Holdings'));
console.log(searchResults[0].getPortfolioName());
      `
    },
    {},
    {}
  )}</div>
</div>`;
});
const AboutSection_svelte_svelte_type_style_lang = "";
const css$2 = {
  code: ".svelte-pz6qti.svelte-pz6qti::before,.svelte-pz6qti.svelte-pz6qti::after,.svelte-pz6qti.svelte-pz6qti{padding:0;margin:0;box-sizing:border-box}.About_section.svelte-pz6qti.svelte-pz6qti{padding:4em 1em 1em 1em;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1.5em;background-color:#1b6f85;height:50vh}.About_section.svelte-pz6qti .abt_section.svelte-pz6qti{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1.5em}.About_section.svelte-pz6qti .abt_section.svelte-pz6qti:nth-child(n){width:25vw;border:solid 1px rgba(255, 255, 255, 0.102);border-radius:6px;padding:1em}.About_section.svelte-pz6qti .abt_section:nth-child(n) p.svelte-pz6qti{text-align:center}@media screen and (max-width: 600px){.About_section.svelte-pz6qti.svelte-pz6qti{height:-moz-max-content;height:max-content}.About_section.svelte-pz6qti .abt_section.svelte-pz6qti{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1.5em}.About_section.svelte-pz6qti .abt_section.svelte-pz6qti:nth-child(n){min-width:25vw;max-width:30vw;width:300px}.About_section.svelte-pz6qti .abt_section:nth-child(n) p.svelte-pz6qti{font-size:0.8rem}}",
  map: null
};
const AboutSection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$2);
  return `<div class="About_section svelte-pz6qti"><div class="abt_section abt_section_1 svelte-pz6qti"><h2 class="svelte-pz6qti">Fast</h2>
        <p class="svelte-pz6qti">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Aspernatur mollitia incidunt sequi quaerat enim eum deleniti! Deserunt culpa modi maiores?
        </p></div>
    <div class="abt_section abt_section_2 svelte-pz6qti"><h2 class="svelte-pz6qti">Flexible</h2>
        <p class="svelte-pz6qti">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Aspernatur mollitia incidunt sequi quaerat enim eum deleniti! Deserunt culpa modi maiores?
        </p></div>
    <div class="abt_section abt_section_3 svelte-pz6qti"><h2 class="svelte-pz6qti">Accurate</h2>
        <p class="svelte-pz6qti">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Aspernatur mollitia incidunt sequi quaerat enim eum deleniti! Deserunt culpa modi maiores?
        </p></div>
</div>`;
});
const VideoSection_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".svelte-c5dla0.svelte-c5dla0::before,.svelte-c5dla0.svelte-c5dla0::after,.svelte-c5dla0.svelte-c5dla0{padding:0;margin:0;box-sizing:border-box}.Video_section.svelte-c5dla0.svelte-c5dla0{padding:4em 1em 1em 1em;height:50vh;background-color:#0c3a46;border:1px solid #000;display:flex;flex-direction:row;justify-content:center;align-items:flex-start;gap:1em}.Video_section.svelte-c5dla0 h1.svelte-c5dla0{padding-bottom:1em}.Video_section.svelte-c5dla0 p.svelte-c5dla0{width:30vw}",
  map: null
};
const VideoSection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `<div class="Video_section svelte-c5dla0"><div class="video_description svelte-c5dla0"><h1 class="svelte-c5dla0">Api calls</h1>
        <p class="svelte-c5dla0">Lorem ipsum dolor sit amet consectetur adipisicing elit. Non neque voluptatem ut qui quibusdam tempore placeat dolor. Veniam, iusto ab!</p></div>

</div>`;
});
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-1h1fq4o::before,.svelte-1h1fq4o::after,.svelte-1h1fq4o{padding:0;margin:0;box-sizing:border-box}.landing_page_overlay.svelte-1h1fq4o{height:100vh;background-color:#0c3a46}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<div class="landing_page_overlay svelte-1h1fq4o">${validate_component(LandingSection, "LandingSection").$$render($$result, {}, {}, {})}
 ${validate_component(AboutSection, "AboutSection").$$render($$result, {}, {}, {})}
 ${validate_component(VideoSection, "VideoSection").$$render($$result, {}, {}, {})}
</div>`;
});
export {
  Page as default
};
