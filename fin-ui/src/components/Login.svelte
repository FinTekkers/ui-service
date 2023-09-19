<script lang="ts">
  import { Authentication, goto, Authenticate } from "../store/store";
  import Icon from "@iconify/svelte";
</script>

<div class=" w-screen h-screen flex justify-center items-center">
  <div class="login_container grid grid-cols-2 rounded relative">
    <div class="branding branding-image p-2 rounded-xl">
      <div
        class="branding-image-overlay backdrop-blur-lg bg-black/30 rounded-lg"
      >
        <h1 class="test">FINTEKKERS</h1>

        <p>
          Thousands of Lorem ipsum dolor sit amet consectetur adipisicing elit.
          Fugit, fugiat ullam?
        </p>

        <h3>→ Join us today</h3>
      </div>
    </div>
    <div
      class="branding branding-form p-2 rounded-xl flex justify-center items-center"
    >
      <div class="form w-full h-4/5 p-3 grid flex justify-center">
        <div class="form_container">
          <h1 class="sign_up_headline">Sign Up</h1>

          <div class="form_fields">
            <label for="Email">
              <span>Email address:</span>
              <input
                class="rounded-md text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm"
                type="text"
                name="Email"
                placeholder="Enter your email"
              />
            </label>
            <label for="Password">
              <span>Password:</span>
              <input
                class="rounded-md text-slate-400 block bg-white w-full py-2 focus:outline-none focus:border-cyan-900 focus:ring-cyan-900 focus:ring-1 sm:text-sm"
                type="text"
                name="Password"
                placeholder="Enter your password"
              />
            </label>
            <label for="isPassWordVisible">
              <input
                class="rounded-md bg-white checkIsPasswordVisible"
                type="checkbox"
                name="isPassWordVisible"
                id="isPassWordVisible"
              />
              <span>show password</span>
            </label>
            <button class="sign_up_btn text-white font-bold py-2 px-4 rounded"
              >Sign Up →
            </button>
          </div>

          <div class="divider">
            <div class="one border-t border-gray-500" />
            <div class="two border-t border-gray-500" />
            OR
          </div>

          <div class="google_OAuth">
            <button
              class="font-bold py-2 px-4 rounded focus:outline-none focus:border-green-500 hover:border-green-500 focus:ring-green-500 focus:ring-1"
              on:click={() => {
                Authenticate(true);

                if ($Authentication) {
                  goto("/portfolios");
                }
              }}
            >
              <Icon
                icon="flat-color-icons:google"
                style="width: 25px; height: 25px;"
              />
              <span> Continue with Google </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @import "../style.scss";
  @import "../login.scss";
</style>
