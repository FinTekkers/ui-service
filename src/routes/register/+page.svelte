<script lang="ts">
  import LoginBrandPage from "../../components/login/LoginBrandPage.svelte";
  import SignUpForm from "../../components/login/SignUpForm.svelte";
  import { page } from '$app/stores';
  export let data: App.PageData;
  export let form: App.Error;

  $: redirectTo = $page.url.searchParams.get('redirectTo') ?? '';
  $: loginHref = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login';
</script>

<div class="loginpage_bgc_overlay h-full flex justify-between">
  <form method="POST" action="?/register">
    <div
      class="login-container-parent w-screen h-screen flex justify-center items-center"
    >
      <div class="login_container grid grid-cols-2 rounded relative">
        <LoginBrandPage />
        <div
          class="branding branding-form p-2 rounded-xl flex justify-center items-center"
        >
          <div class="form w-full p-3 grid flex justify-center bg-white">
            <div class="form_container">
              <h1 class="form_headline">Sign Up</h1>
              {#if form?.formError}
                <p class="text-red-500 text-sm mb-2">{form.formError.message ?? form.formError}</p>
              {/if}

              <SignUpForm {data} {form} />
              <p class="text-sm mt-3">Already have an account? <a href={loginHref} class="text-blue-600 underline">Sign in</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</div>

<style>
  @import "../../styles/_shared.scss";
  @import "../../login.scss";

  .form_container {
    position: relative;
  }

  .form_headline {
    position: absolute;
    top: 20%;
  }

  @media screen and (max-width: 600px) {
    .form_headline {
      top: -5%;
    }
  }
</style>
