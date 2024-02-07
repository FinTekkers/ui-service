import { c as create_ssr_component, d as subscribe, e as escape } from './index3-d286ad7b.js';
import { p as page } from './stores-97f0124a.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  $$unsubscribe_page();
  return `<body><div>Welcome to nested route
        <div>${escape($page.params.id)}</div>
        <div>${escape(JSON.stringify(data.nums))}</div></div></body>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-4fa6eb82.js.map
