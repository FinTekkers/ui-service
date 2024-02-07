import { c as create_ssr_component, v as validate_component, d as subscribe, e as escape, a as add_attribute, b as each } from './index3-d286ad7b.js';
import { b as booleanStore, a as booleanKeys, I as Icon } from './store-5db37d9d.js';
import './index2-57f07b7d.js';

const css$4 = {
  code: ".svelte-fy6vfq::before,.svelte-fy6vfq::after,.svelte-fy6vfq{padding:0;margin:0;box-sizing:border-box}",
  map: null
};
const LoginBrandPage = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let isSignInOrSignUp;
  let $booleanStore, $$unsubscribe_booleanStore;
  $$unsubscribe_booleanStore = subscribe(booleanStore, (value) => $booleanStore = value);
  $$result.css.add(css$4);
  isSignInOrSignUp = $booleanStore[booleanKeys.IS_SIGN_IN_OR_SIGN_UP];
  $$unsubscribe_booleanStore();
  return `<div class="branding-image p-2 rounded-xl svelte-fy6vfq"><div class="branding-image-overlay backdrop-blur-lg bg-black/30 rounded-lg svelte-fy6vfq"><h1 class="logo svelte-fy6vfq">FINTEKKERS</h1>
            <p class="svelte-fy6vfq">Thousands of Lorem ipsum dolor sit amet consectetur adipisicing
              elit. Fugit, fugiat ullam?
            </p>
            ${isSignInOrSignUp ? `<button class="svelte-fy6vfq">→ Sign In</button>` : `<button class="svelte-fy6vfq">→ Sign Up</button>`}</div>
</div>`;
});
const css$3 = {
  code: ".svelte-1b8p5hm::before,.svelte-1b8p5hm::after,.svelte-1b8p5hm{padding:0;margin:0;box-sizing:border-box}.svelte-1b8p5hm:is(button){border:solid 2px #1b6f85;background-color:whitesmoke;color:#1b6f85;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;height:6vh;width:100%;transition:all 0.5s ease}.svelte-1b8p5hm:is(button):hover{color:whitesmoke;background-color:#1b6f85;border:solid 1px whitesmoke}",
  map: null
};
const Google_OAuth = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$3);
  return `<button type="submit" class="font-bold py-2 px-4 rounded focus:outline-none focus:border-green-500 hover:border-green-500 focus:ring-green-500 focus:ring-1 svelte-1b8p5hm">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "flat-color-icons:google",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
        <span class="svelte-1b8p5hm">Continue with Google</span>
   </button>`;
});
const css$2 = {
  code: ".svelte-1rnm8at.svelte-1rnm8at::before,.svelte-1rnm8at.svelte-1rnm8at::after,.svelte-1rnm8at.svelte-1rnm8at{padding:0;margin:0;box-sizing:border-box}.sign_in_fields.svelte-1rnm8at.svelte-1rnm8at{display:grid;grid-template-columns:1fr;grid-template-rows:auto;grid-area:2/1/6/-1;gap:1em}.sign_in_fields.svelte-1rnm8at label.svelte-1rnm8at:nth-child(n){grid-column:1/-1;color:#86929c}.sign_in_fields.svelte-1rnm8at label:nth-child(n) .svelte-1rnm8at:is(button){width:100%}.sign_in_fields.svelte-1rnm8at .passwordField.svelte-1rnm8at{position:relative}.sign_in_fields.svelte-1rnm8at .svelte-1rnm8at:is(label){height:-moz-max-content;height:max-content;position:relative}.sign_in_fields.svelte-1rnm8at :is(label) .svelte-1rnm8at:is(input){width:100%;height:3em;color:#86929c;padding-left:1em;font-size:1rem}.sign_in_fields.svelte-1rnm8at .form_btn.svelte-1rnm8at{background-color:#1b6f85;height:6vh}.sign_in_fields.svelte-1rnm8at .togglePasswordDisplayIcon.svelte-1rnm8at{position:absolute;top:50%;right:5%;transition:all 0.5s ease-in-out;cursor:pointer;color:#86929c}.sign_in_fields.svelte-1rnm8at .divider.svelte-1rnm8at{grid-area:6/1/6/-1;display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:repeat(2, 20px);position:relative;justify-content:center;align-items:center;color:#86929c}.sign_in_fields.svelte-1rnm8at .divider .one.svelte-1rnm8at{grid-column:1/1}.sign_in_fields.svelte-1rnm8at .divider .two.svelte-1rnm8at{grid-column:3/3}.sign_in_fields.svelte-1rnm8at .divider .svelte-1rnm8at:is(span){grid-column:2/2;position:absolute;top:0;left:50%;transform:translateX(-50%)}.sign_in_fields.svelte-1rnm8at .google_OAuth.svelte-1rnm8at{grid-area:7/1/7/-1}.error_message.svelte-1rnm8at.svelte-1rnm8at{color:#c43d5a}",
  map: null
};
const SignInForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $booleanStore, $$unsubscribe_booleanStore;
  $$unsubscribe_booleanStore = subscribe(booleanStore, (value) => $booleanStore = value);
  let { form } = $$props;
  if ($$props.form === void 0 && $$bindings.form && form !== void 0)
    $$bindings.form(form);
  $$result.css.add(css$2);
  $$unsubscribe_booleanStore();
  return `<div class="sign_in_fields svelte-1rnm8at"><label for="Email" class="svelte-1rnm8at"><span class="svelte-1rnm8at">Email address:</span>
                        <input class="${"rounded-md " + escape("border-red-900", true) + " text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm svelte-1rnm8at"}" type="text" name="Email" placeholder="Enter your email"></label>

                      <label for="Password" class="passwordField svelte-1rnm8at"><span class="svelte-1rnm8at">Password:</span>
                        <input class="${"rounded-md " + escape("border-red-900", true) + " text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm svelte-1rnm8at"}"${add_attribute("type", $booleanStore.IS_PASSWORD_VISIBLE ? "text" : "password", 0)} name="Password" placeholder="Enter your password">

                      ${$booleanStore.IS_PASSWORD_VISIBLE ? `<span class="togglePasswordDisplayIcon svelte-1rnm8at">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:eye-linear",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</span>` : `<span class="togglePasswordDisplayIcon svelte-1rnm8at">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "clarity:eye-hide-line",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</span>`}</label>

                      <div class="error_message svelte-1rnm8at">${form?.formError ? `${each(form.formError, (error) => {
    return `<p class="svelte-1rnm8at">${escape(error)}</p>`;
  })}` : ``}</div>
                    
                      ${$booleanStore.IS_SIGN_IN_OR_SIGN_UP ? `<button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded svelte-1rnm8at">Sign Up →
                            </button>` : `<button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded svelte-1rnm8at">Sign In →
                            </button>`}

                    <div class="divider svelte-1rnm8at"><div class="one border-t border-gray-500 svelte-1rnm8at"></div>
                                    <span class="svelte-1rnm8at">OR</span>
                                    <div class="two border-t border-gray-500 svelte-1rnm8at"></div></div>
        
                    <div class="google_OAuth svelte-1rnm8at">${validate_component(Google_OAuth, "Google_OAuth").$$render($$result, {}, {}, {})}</div>
                
</div>`;
});
const css$1 = {
  code: ".svelte-hqflbg.svelte-hqflbg::before,.svelte-hqflbg.svelte-hqflbg::after,.svelte-hqflbg.svelte-hqflbg{padding:0;margin:0;box-sizing:border-box}.sign_up_fields.svelte-hqflbg.svelte-hqflbg{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto;grid-area:2/1/6/-1;gap:1em}.sign_up_fields.svelte-hqflbg .svelte-hqflbg:is(label){height:-moz-max-content;height:max-content;position:relative}.sign_up_fields.svelte-hqflbg :is(label) .svelte-hqflbg:is(input){width:100%;height:2.5em;color:#86929c;padding-left:1em}.sign_up_fields.svelte-hqflbg label.svelte-hqflbg:nth-child(n){grid-column:1/-1}.sign_up_fields.svelte-hqflbg label:nth-child(n) .svelte-hqflbg:is(button){width:100%}.sign_up_fields.svelte-hqflbg label.svelte-hqflbg:nth-child(1){grid-column:1/2}.sign_up_fields.svelte-hqflbg label.svelte-hqflbg:nth-child(2){grid-column:2/-1}.sign_up_fields.svelte-hqflbg .form_btn.svelte-hqflbg{background-color:#1b6f85;height:6vh}.sign_up_fields.svelte-hqflbg .togglePasswordDisplayIcon_signUp.svelte-hqflbg{position:absolute;top:15%;right:5%;transition:all 0.5s ease-in-out;cursor:pointer;color:#86929c}.sign_up_fields.svelte-hqflbg .divider.svelte-hqflbg{grid-area:6/1/6/-1;display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:repeat(2, 20px);position:relative;justify-content:center;align-items:center;color:#86929c}.sign_up_fields.svelte-hqflbg .divider .one.svelte-hqflbg{grid-column:1/1}.sign_up_fields.svelte-hqflbg .divider .two.svelte-hqflbg{grid-column:3/3}.sign_up_fields.svelte-hqflbg .divider .svelte-hqflbg:is(span){grid-column:2/2;position:absolute;top:0;left:50%;transform:translateX(-50%)}.sign_up_fields.svelte-hqflbg .google_OAuth.svelte-hqflbg{grid-area:7/1/7/-1}",
  map: null
};
const SignUpForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let isPasswordVisible;
  let $booleanStore, $$unsubscribe_booleanStore;
  $$unsubscribe_booleanStore = subscribe(booleanStore, (value) => $booleanStore = value);
  $$result.css.add(css$1);
  isPasswordVisible = $booleanStore[booleanKeys.IS_PASSWORD_VISIBLE];
  $$unsubscribe_booleanStore();
  return `<div class="sign_up_fields svelte-hqflbg"><label for="name" class="svelte-hqflbg"><input class="rounded-md sign_up_name svelte-hqflbg" type="text" name="name" id="name" placeholder="Enter name"></label>

                        <label for="surname" class="svelte-hqflbg"><input class="rounded-md sign_up_surname svelte-hqflbg" type="text" name="surname" id="surname" placeholder="Enter surname"></label>

                        <label for="email" class="svelte-hqflbg"><input class="rounded-md sign_up_email svelte-hqflbg" type="email" name="email" id="email" placeholder="Enter email"></label>

                        <label for="password" class="svelte-hqflbg"><input class="rounded-md sign_up_password svelte-hqflbg"${add_attribute("type", isPasswordVisible ? "text" : "password", 0)} name="password" id="password" placeholder="Enter password">

                          ${isPasswordVisible ? `<span class="togglePasswordDisplayIcon_signUp svelte-hqflbg">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:eye-linear",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</span>` : `<span class="togglePasswordDisplayIcon_signUp svelte-hqflbg">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "clarity:eye-hide-line",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</span>`}</label>

                        <label for="confirmpassword" class="svelte-hqflbg"><input class="rounded-md sign_up_confirm_password svelte-hqflbg"${add_attribute("type", isPasswordVisible ? "text" : "password", 0)} name="confirmpassword" id="confirmpassword" placeholder="Confirm password"></label>

                      <label for="submit" class="svelte-hqflbg"><button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded svelte-hqflbg">Sign Up →
                            </button></label>

                        <div class="divider svelte-hqflbg"><div class="one border-t border-gray-500 svelte-hqflbg"></div>
                                 <span class="svelte-hqflbg">OR</span>
                              <div class="two border-t border-gray-500 svelte-hqflbg"></div></div>
  
                      <div class="google_OAuth svelte-hqflbg">${validate_component(Google_OAuth, "Google_OAuth").$$render($$result, {}, {}, {})}</div>
              </div>`;
});
const LoginForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let isSignInOrSignUp;
  let $booleanStore, $$unsubscribe_booleanStore;
  $$unsubscribe_booleanStore = subscribe(booleanStore, (value) => $booleanStore = value);
  let { data } = $$props;
  let { form } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0)
    $$bindings.form(form);
  isSignInOrSignUp = $booleanStore[booleanKeys.IS_SIGN_IN_OR_SIGN_UP];
  $$unsubscribe_booleanStore();
  return `<div class="form w-full p-3 grid flex justify-center"><div class="form_container">${isSignInOrSignUp ? `<h1 class="form_headline">Sign Up</h1>` : `<h1 class="form_headline">Sign In</h1>`}

                ${isSignInOrSignUp ? `${validate_component(SignUpForm, "SignUpForm").$$render($$result, { data, form }, {}, {})}` : `${validate_component(SignInForm, "SignInForm").$$render($$result, { data, form }, {}, {})}`}</div></div>`;
});
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
  return `<div class="loginpage_bgc_overlay h-full flex justify-between"><form method="POST" action="?/login"><div class="login-container-parent w-screen h-screen flex justify-center items-center"><div class="login_container grid grid-cols-2 rounded relative">${validate_component(LoginBrandPage, "LoginBrandPage").$$render($$result, {}, {}, {})}
              <div class="branding branding-form p-2 rounded-xl flex justify-center items-center">${validate_component(LoginForm, "LoginForm").$$render($$result, { data, form }, {}, {})}</div></div></div></form>
</div>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-eafd3db6.js.map
