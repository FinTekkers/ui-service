import { c as create_ssr_component, f as subscribe, e as escape, a as add_attribute, v as validate_component, d as each } from "../../../chunks/index3.js";
import { i as isSignInOrSignUp, a as isPasswordVisible } from "../../../chunks/store.js";
import { I as Icon } from "../../../chunks/Icon.js";
const LoginBrandPage_svelte_svelte_type_style_lang = "";
const css$3 = {
  code: ".svelte-1wvmado::before,.svelte-1wvmado::after,.svelte-1wvmado{padding:0;margin:0;box-sizing:border-box}",
  map: null
};
const LoginBrandPage = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isSignInOrSignUp, $$unsubscribe_isSignInOrSignUp;
  $$unsubscribe_isSignInOrSignUp = subscribe(isSignInOrSignUp, (value) => $isSignInOrSignUp = value);
  $$result.css.add(css$3);
  $$unsubscribe_isSignInOrSignUp();
  return `<div class="branding-image p-2 rounded-xl svelte-1wvmado"><div class="branding-image-overlay backdrop-blur-lg bg-black/30 rounded-lg svelte-1wvmado"><h1 class="logo svelte-1wvmado">FINTEKKERS</h1>
  
            <p class="svelte-1wvmado">Thousands of Lorem ipsum dolor sit amet consectetur adipisicing
              elit. Fugit, fugiat ullam?
            </p>
            ${$isSignInOrSignUp ? `<button class="svelte-1wvmado">→ Sign In</button>` : `<button class="svelte-1wvmado">→ Sign Up</button>`}</div>
</div>`;
});
const SignInForm_svelte_svelte_type_style_lang = "";
const css$2 = {
  code: ".svelte-1vmghn4.svelte-1vmghn4::before,.svelte-1vmghn4.svelte-1vmghn4::after,.svelte-1vmghn4.svelte-1vmghn4{padding:0;margin:0;box-sizing:border-box}.sign_in_fields.svelte-1vmghn4.svelte-1vmghn4{display:grid;grid-template-columns:1fr;grid-template-rows:auto;grid-area:2/1/6/-1;gap:1em}.sign_in_fields.svelte-1vmghn4 label.svelte-1vmghn4:nth-child(n){grid-column:1/-1;color:#86929c}.sign_in_fields.svelte-1vmghn4 label:nth-child(n) button.svelte-1vmghn4{width:100%}.sign_in_fields.svelte-1vmghn4 .passwordField.svelte-1vmghn4{position:relative}.sign_in_fields.svelte-1vmghn4 label.svelte-1vmghn4{height:-moz-max-content;height:max-content;position:relative}.sign_in_fields.svelte-1vmghn4 label input.svelte-1vmghn4{width:100%;height:3em;color:#86929c;padding-left:1em;font-size:1rem}.sign_in_fields.svelte-1vmghn4 .form_btn.svelte-1vmghn4{background-color:#1b6f85;height:6vh}.sign_in_fields.svelte-1vmghn4 .togglePasswordDisplayIcon.svelte-1vmghn4{position:absolute;top:50%;right:5%;transition:all 0.5s ease-in-out;cursor:pointer;color:#86929c}.sign_in_fields.svelte-1vmghn4 .divider.svelte-1vmghn4{grid-area:6/1/6/-1;display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:repeat(2, 20px);position:relative;justify-content:center;align-items:center;color:#86929c}.sign_in_fields.svelte-1vmghn4 .divider .one.svelte-1vmghn4{grid-column:1/1}.sign_in_fields.svelte-1vmghn4 .divider .two.svelte-1vmghn4{grid-column:3/3}.sign_in_fields.svelte-1vmghn4 .divider span.svelte-1vmghn4{grid-column:2/2;position:absolute;top:0;left:50%;transform:translateX(-50%)}.sign_in_fields.svelte-1vmghn4 .google_OAuth.svelte-1vmghn4{grid-area:7/1/7/-1}.sign_in_fields.svelte-1vmghn4 .google_OAuth button.svelte-1vmghn4{border:solid 2px #1b6f85;background-color:whitesmoke;color:#1b6f85;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;height:6vh;width:100%;transition:all 0.5s ease}.sign_in_fields.svelte-1vmghn4 .google_OAuth button.svelte-1vmghn4:hover{color:whitesmoke;background-color:#1b6f85;border:solid 1px whitesmoke}.error_message.svelte-1vmghn4.svelte-1vmghn4{color:#c43d5a}",
  map: null
};
const SignInForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $isPasswordVisible, $$unsubscribe_isPasswordVisible;
  let $isSignInOrSignUp, $$unsubscribe_isSignInOrSignUp;
  $$unsubscribe_isPasswordVisible = subscribe(isPasswordVisible, (value) => $isPasswordVisible = value);
  $$unsubscribe_isSignInOrSignUp = subscribe(isSignInOrSignUp, (value) => $isSignInOrSignUp = value);
  let { data } = $$props;
  let { form } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0)
    $$bindings.form(form);
  $$result.css.add(css$2);
  $$unsubscribe_isPasswordVisible();
  $$unsubscribe_isSignInOrSignUp();
  return `

<div class="sign_in_fields svelte-1vmghn4"><label for="Email" class="svelte-1vmghn4"><span class="svelte-1vmghn4">Email address:</span>
                        <input class="${"rounded-md " + escape("border-red-900", true) + " text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm svelte-1vmghn4"}" type="text" name="Email" placeholder="Enter your email"></label>
                      <label for="Password" class="passwordField svelte-1vmghn4"><span class="svelte-1vmghn4">Password:</span>
                        <input class="${"rounded-md " + escape("border-red-900", true) + " text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm svelte-1vmghn4"}"${add_attribute("type", $isPasswordVisible ? "text" : "password", 0)} name="Password" placeholder="Enter your password">

                      ${$isPasswordVisible ? `<span class="togglePasswordDisplayIcon svelte-1vmghn4">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:eye-linear",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</span>` : `<span class="togglePasswordDisplayIcon svelte-1vmghn4">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "clarity:eye-hide-line",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</span>`}</label>

                      <div class="error_message svelte-1vmghn4">${form?.formError ? `${each(form.formError, (error) => {
    return `<p class="svelte-1vmghn4">${escape(error)}</p>`;
  })}` : ``}</div>
                    
                      ${$isSignInOrSignUp ? `<button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded svelte-1vmghn4">Sign Up →
                            </button>` : `<button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded svelte-1vmghn4">Sign In →
                            </button>`}

                    <div class="divider svelte-1vmghn4"><div class="one border-t border-gray-500 svelte-1vmghn4"></div>
                                    <span class="svelte-1vmghn4">OR</span>
                                    <div class="two border-t border-gray-500 svelte-1vmghn4"></div></div>
        
                    <div class="google_OAuth svelte-1vmghn4"><button type="submit" class="font-bold py-2 px-4 rounded focus:outline-none focus:border-green-500 hover:border-green-500 focus:ring-green-500 focus:ring-1 svelte-1vmghn4">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "flat-color-icons:google",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
                                            <span class="svelte-1vmghn4">Continue with Google </span></button></div>
                
</div>`;
});
const SignUpForm_svelte_svelte_type_style_lang = "";
const css$1 = {
  code: ".svelte-82zqe7.svelte-82zqe7::before,.svelte-82zqe7.svelte-82zqe7::after,.svelte-82zqe7.svelte-82zqe7{padding:0;margin:0;box-sizing:border-box}.sign_up_fields.svelte-82zqe7.svelte-82zqe7{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto;grid-area:2/1/6/-1;gap:1em}.sign_up_fields.svelte-82zqe7 label.svelte-82zqe7{height:-moz-max-content;height:max-content;position:relative}.sign_up_fields.svelte-82zqe7 label input.svelte-82zqe7{width:100%;height:2.5em;color:#86929c;padding-left:1em}.sign_up_fields.svelte-82zqe7 label.svelte-82zqe7:nth-child(n){grid-column:1/-1}.sign_up_fields.svelte-82zqe7 label:nth-child(n) button.svelte-82zqe7{width:100%}.sign_up_fields.svelte-82zqe7 label.svelte-82zqe7:nth-child(1){grid-column:1/2}.sign_up_fields.svelte-82zqe7 label.svelte-82zqe7:nth-child(2){grid-column:2/-1}.sign_up_fields.svelte-82zqe7 .form_btn.svelte-82zqe7{background-color:#1b6f85;height:6vh}.sign_up_fields.svelte-82zqe7 .togglePasswordDisplayIcon_signUp.svelte-82zqe7{position:absolute;top:15%;right:5%;transition:all 0.5s ease-in-out;cursor:pointer;color:#86929c}.sign_up_fields.svelte-82zqe7 .divider.svelte-82zqe7{grid-area:6/1/6/-1;display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:repeat(2, 20px);position:relative;justify-content:center;align-items:center;color:#86929c}.sign_up_fields.svelte-82zqe7 .divider .one.svelte-82zqe7{grid-column:1/1}.sign_up_fields.svelte-82zqe7 .divider .two.svelte-82zqe7{grid-column:3/3}.sign_up_fields.svelte-82zqe7 .divider span.svelte-82zqe7{grid-column:2/2;position:absolute;top:0;left:50%;transform:translateX(-50%)}.sign_up_fields.svelte-82zqe7 .google_OAuth.svelte-82zqe7{grid-area:7/1/7/-1}.sign_up_fields.svelte-82zqe7 .google_OAuth button.svelte-82zqe7{border:solid 2px #1b6f85;background-color:whitesmoke;color:#1b6f85;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;height:6vh;width:100%;transition:all 0.5s ease}.sign_up_fields.svelte-82zqe7 .google_OAuth button.svelte-82zqe7:hover{color:whitesmoke;background-color:#1b6f85;border:solid 1px whitesmoke}",
  map: null
};
const SignUpForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  let { form } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.form === void 0 && $$bindings.form && form !== void 0)
    $$bindings.form(form);
  $$result.css.add(css$1);
  return `

   <div class="sign_up_fields svelte-82zqe7"><label for="name" class="svelte-82zqe7"><input class="rounded-md sign_up_name svelte-82zqe7" type="text" name="name" id="name" placeholder="Enter name"></label>
                        <label for="surname" class="svelte-82zqe7"><input class="rounded-md sign_up_surname svelte-82zqe7" type="text" name="surname" id="surname" placeholder="Enter surname"></label>
                        <label for="email" class="svelte-82zqe7"><input class="rounded-md sign_up_email svelte-82zqe7" type="email" name="email" id="email" placeholder="Enter email"></label>
                        <label for="password" class="svelte-82zqe7"><input class="rounded-md sign_up_password svelte-82zqe7"${add_attribute("type", isPasswordVisible ? "text" : "password", 0)} name="password" id="password" placeholder="Enter password">

                          ${isPasswordVisible ? `<span class="togglePasswordDisplayIcon_signUp svelte-82zqe7">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:eye-linear",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</span>` : `<span class="togglePasswordDisplayIcon_signUp svelte-82zqe7">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "clarity:eye-hide-line",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</span>`}</label>
                        <label for="confirmpassword" class="svelte-82zqe7"><input class="rounded-md sign_up_confirm_password svelte-82zqe7"${add_attribute("type", isPasswordVisible ? "text" : "password", 0)} name="confirmpassword" id="confirmpassword" placeholder="Confirm password"></label>

                      <label for="submit" class="svelte-82zqe7"><button type="submit" class="form_btn text-white font-bold py-2 px-4 rounded svelte-82zqe7">Sign Up →
                            </button></label>

                        <div class="divider svelte-82zqe7"><div class="one border-t border-gray-500 svelte-82zqe7"></div>
                                <span class="svelte-82zqe7">OR</span>
                                <div class="two border-t border-gray-500 svelte-82zqe7"></div></div>
  
              <div class="google_OAuth svelte-82zqe7"><button type="submit" class="font-bold py-2 px-4 rounded focus:outline-none focus:border-green-500 hover:border-green-500 focus:ring-green-500 focus:ring-1 svelte-82zqe7">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "flat-color-icons:google",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
                  <span class="svelte-82zqe7">Continue with Google </span></button></div>
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

              ${$isSignInOrSignUp ? `${validate_component(SignUpForm, "SignUpForm").$$render($$result, { data, form }, {}, {})}` : `${validate_component(SignInForm, "SignInForm").$$render($$result, { data, form }, {}, {})}`}</div></div>`;
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
  return `<div class="loginpage_bgc_overlay h-full flex justify-between"><form method="POST" action="?/login"><div class="login-container-parent w-screen h-screen flex justify-center items-center"><div class="login_container grid grid-cols-2 rounded relative">${validate_component(LoginBrandPage, "LoginBrandPage").$$render($$result, {}, {}, {})}
              <div class="branding branding-form p-2 rounded-xl flex justify-center items-center">${validate_component(LoginForm, "LoginForm").$$render($$result, { data, form }, {}, {})}</div></div></div></form>
</div>`;
});
export {
  Page as default
};
