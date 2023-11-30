import { c as create_ssr_component, d as subscribe, a as add_attribute, v as validate_component, e as escape, g as each } from "../../../chunks/index3.js";
import { i as isSignInOrSignUp } from "../../../chunks/store.js";
import { I as Icon } from "../../../chunks/Icon.js";
const LoginBrandPage_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".svelte-mq5h0e::before,.svelte-mq5h0e::after,.svelte-mq5h0e{padding:0;margin:0;box-sizing:border-box}",
  map: null
};
const LoginBrandPage = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isSignInOrSignUp, $$unsubscribe_isSignInOrSignUp;
  $$unsubscribe_isSignInOrSignUp = subscribe(isSignInOrSignUp, (value) => $isSignInOrSignUp = value);
  $$result.css.add(css$1);
  $$unsubscribe_isSignInOrSignUp();
  return `<div class="branding-image p-2 rounded-xl svelte-mq5h0e"><div class="branding-image-overlay backdrop-blur-lg bg-black/30 rounded-lg svelte-mq5h0e"><h1 class="logo svelte-mq5h0e">FINTEKKERS</h1>
  
            <p class="svelte-mq5h0e">Thousands of Lorem ipsum dolor sit amet consectetur adipisicing
              elit. Fugit, fugiat ullam?
            </p>
            ${$isSignInOrSignUp ? `<button class="svelte-mq5h0e">→ Sign In</button>` : `<button class="svelte-mq5h0e">→ Sign Up</button>`}</div>
</div>`;
});
const LoginForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isSignInOrSignUp, $$unsubscribe_isSignInOrSignUp;
  $$unsubscribe_isSignInOrSignUp = subscribe(isSignInOrSignUp, (value) => $isSignInOrSignUp = value);
  let { data } = $$props;
  let { form } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0)
    $$bindings.form(form);
  $$unsubscribe_isSignInOrSignUp();
  return `<div class="form w-full p-3 grid flex justify-center"><div class="form_container">${$isSignInOrSignUp ? `<h1 class="form_headline">Sign Up</h1>` : `<h1 class="form_headline">Sign In</h1>`}

              ${$isSignInOrSignUp ? `<div class="sign_up_fields"><label for="name"><input class="rounded-md sign_up_name" type="text" name="name" id="name" placeholder="Enter name"></label>
              <label for="surname"><input class="rounded-md sign_up_surname" type="text" name="surname" id="surname" placeholder="Enter surname"></label>
              <label for="email"><input class="rounded-md sign_up_email" type="email" name="email" id="email" placeholder="Enter email"></label>
              <label for="password"><input class="rounded-md sign_up_password"${add_attribute("type", "password", 0)} name="password" id="password" placeholder="Enter password">

                 ${`<span class="togglePasswordDisplayIcon_signUp">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "clarity:eye-hide-line",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</span>`}</label>
              <label for="confirmpassword"><input class="rounded-md sign_up_confirm_password"${add_attribute("type", "password", 0)} name="confirmpassword" id="confirmpassword" placeholder="Confirm password"></label>

              <label for=""><button class="form_btn text-white font-bold py-2 px-4 rounded">Sign Up →
             </button></label></div>` : `<div class="sign_in_fields"><label for="Email"><span>Email address:</span>
                  <input class="${"rounded-md " + escape("border-red-900", true) + " text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm"}" type="text" name="Email" placeholder="Enter your email"></label>
                <label for="Password" class="passwordField"><span>Password:</span>
                  <input class="${"rounded-md " + escape("border-red-900", true) + " text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm"}"${add_attribute("type", "password", 0)} name="Password" placeholder="Enter your password">

                 ${`<span class="togglePasswordDisplayIcon">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "clarity:eye-hide-line",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</span>`}</label>

                <div class="error_message">${form?.formError ? `${each(form.formError, (error) => {
    return `<p>${escape(error)}</p>`;
  })}` : ``}</div>
              
                ${$isSignInOrSignUp ? `<button class="form_btn text-white font-bold py-2 px-4 rounded">Sign Up →
                </button>` : `<button class="form_btn text-white font-bold py-2 px-4 rounded">Sign In →
                </button>`}</div>`}
  
              <div class="divider"><div class="one border-t border-gray-500"></div>
                <div class="two border-t border-gray-500"></div>
                OR
              </div>
  
              <div class="google_OAuth"><button type="submit" class="font-bold py-2 px-4 rounded focus:outline-none focus:border-green-500 hover:border-green-500 focus:ring-green-500 focus:ring-1">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "flat-color-icons:google",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
                  <span>Continue with Google </span></button></div></div></div>`;
});
const _page_svelte_svelte_type_style_lang = "";
const css = {
  code: '@import "../../style.scss";@import "../../login.scss";',
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
  return `<div class="loginpage_bgc_overlay h-full flex justify-between"><form method="post"><div class="w-screen h-screen flex justify-center items-center"><div class="login_container grid grid-cols-2 rounded relative">${validate_component(LoginBrandPage, "LoginBrandPage").$$render($$result, {}, {}, {})}
        <div class="branding branding-form p-2 rounded-xl flex justify-center items-center">${validate_component(LoginForm, "LoginForm").$$render($$result, { data, form }, {}, {})}</div></div></div></form>
</div>`;
});
export {
  Page as default
};
