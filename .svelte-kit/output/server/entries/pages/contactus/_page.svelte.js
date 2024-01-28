import { c as create_ssr_component } from "../../../chunks/index3.js";
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: ".svelte-wfm9tf.svelte-wfm9tf::before,.svelte-wfm9tf.svelte-wfm9tf::after,.svelte-wfm9tf.svelte-wfm9tf{padding:0;margin:0;box-sizing:border-box}.contact-us.svelte-wfm9tf.svelte-wfm9tf{padding:1em;display:grid;grid-template-columns:repeat(2, 1fr);grid-template-rows:1fr;height:100vh;background:#0c3a46}.contact-us.svelte-wfm9tf .contact-us-text.svelte-wfm9tf{padding:1em;display:grid;grid-template-columns:repeat(4, 1fr);grid-template-rows:repeat(8, 50px)}.contact-us.svelte-wfm9tf .contact-us-text h1.svelte-wfm9tf{font-size:2rem;color:whitesmoke;grid-area:5/2/5/3}.contact-us.svelte-wfm9tf .contact-us-text p.svelte-wfm9tf{color:whitesmoke;grid-area:6/2/6/4}.contact-us.svelte-wfm9tf .contact-us-form.svelte-wfm9tf{display:grid;grid-template-columns:repeat(6, 1fr);grid-template-rows:repeat(6, 100px)}.contact-us.svelte-wfm9tf .contact-us-form form.svelte-wfm9tf{grid-column:2/6;grid-row:2/7;display:grid;grid-template-columns:repeat(auto-fit, 1fr);grid-template-rows:repeat(8, 100px);gap:1em}.contact-us.svelte-wfm9tf .contact-us-form form label.svelte-wfm9tf{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:0.5em;color:#86929c;height:-moz-max-content;height:max-content;position:relative;grid-column:1/-1;display:grid;grid-template-columns:1fr;grid-template-rows:1fr}.contact-us.svelte-wfm9tf .contact-us-form form label.svelte-wfm9tf:nth-child(1){grid-area:1/1/2/-1}.contact-us.svelte-wfm9tf .contact-us-form form label.svelte-wfm9tf:nth-child(2){grid-area:2/1/3/-1}.contact-us.svelte-wfm9tf .contact-us-form form label.svelte-wfm9tf:nth-child(3){grid-area:3/1/4/-1}.contact-us.svelte-wfm9tf .contact-us-form form label.svelte-wfm9tf:nth-child(4){grid-area:4/1/5/-1}.contact-us.svelte-wfm9tf .contact-us-form form label input.svelte-wfm9tf,.contact-us.svelte-wfm9tf .contact-us-form form label textarea.svelte-wfm9tf{color:#86929c;padding-left:1em;border-radius:6px;min-height:6vh}.contact-us.svelte-wfm9tf .contact-us-form form .submit_btn.svelte-wfm9tf{margin-top:2em;grid-column:1/1;grid-row:5/5;height:8vh;border-radius:6px;background-color:#1b6f85;font-weight:bold}@media screen and (max-width: 1200px){.contact-us.svelte-wfm9tf.svelte-wfm9tf{grid-template-columns:1fr;grid-template-rows:repeat(3, 1fr)}.contact-us.svelte-wfm9tf .contact-us-text.svelte-wfm9tf{grid-area:1/1/1/-1;grid-template-rows:repeat(1, 50px)}.contact-us.svelte-wfm9tf .contact-us-text h1.svelte-wfm9tf{font-size:1.5rem;color:whitesmoke;grid-area:1/2/1/4}.contact-us.svelte-wfm9tf .contact-us-text p.svelte-wfm9tf{color:whitesmoke;grid-area:2/2/2/4;display:none}.contact-us.svelte-wfm9tf .contact-us-form.svelte-wfm9tf{grid-template-columns:repeat(8, 1fr)}.contact-us.svelte-wfm9tf .contact-us-form form.svelte-wfm9tf{grid-column:3/7;grid-row:1/7;display:grid;grid-template-columns:repeat(auto-fit, 1fr);grid-template-rows:repeat(8, 100px);gap:1em}}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  let { form } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0)
    $$bindings.form(form);
  $$result.css.add(css);
  return `<div class="contact-us svelte-wfm9tf"><div class="contact-us-text svelte-wfm9tf"><h1 class="svelte-wfm9tf">Contact Us</h1>
       <p class="svelte-wfm9tf">Need to get in touch with us? Either fill out the form with your inquiry or find the email you&#39;d like to contact below</p></div>
    <div class="contact-us-form svelte-wfm9tf"><form method="POST" action="contactus?/message" class="svelte-wfm9tf"><label for="fistname" class="svelte-wfm9tf"><span class="svelte-wfm9tf">Firstname</span><input id="firstname" name="firstname" type="text" placeholder="firstname" class="svelte-wfm9tf"></label>
            <label for="lastname" class="svelte-wfm9tf"><span class="svelte-wfm9tf">Lastname</span><input id="lastname" name="lastname" type="text" placeholder="lastname" class="svelte-wfm9tf"></label>
            <label for="emaol" class="svelte-wfm9tf"><span class="svelte-wfm9tf">Email</span><input id="email" type="email" name="email" placeholder="email" class="svelte-wfm9tf"></label>
            <label for="message" class="svelte-wfm9tf"><span class="svelte-wfm9tf">What Can we help you with ?</span><textarea id="message" name="message" rows="4" placeholder="" class="svelte-wfm9tf"></textarea></label>
            <input class="submit_btn svelte-wfm9tf" type="submit"></form></div>
</div>`;
});
export {
  Page as default
};
