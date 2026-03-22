<script lang="ts">
  import LoginBrandPage from "../../components/login/LoginBrandPage.svelte";
  import SignInForm from "../../components/login/SignInForm.svelte";
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  export let data: App.PageData;
  export let form: App.Error;

  $: registered = $page.url.searchParams.get('registered') === 'true';
  $: redirectTo = $page.url.searchParams.get('redirectTo') ?? '';
  $: registerHref = redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : '/register';
</script>

<div class="loginpage_bgc_overlay h-full flex justify-between">
  <div
    class="login-container-parent w-screen h-screen flex justify-center items-center"
  >
    <div class="login_container grid grid-cols-2 rounded relative">
      <LoginBrandPage />

      <div
        class="branding branding-form p-2 rounded-xl flex justify-center items-center"
      >
        <form method="POST" action="?/login" use:enhance class="form w-full p-3 grid flex justify-center bg-white">
          <div class="form_container">
            <h1 class="form_headline">Sign In</h1>
            {#if registered}
              <p class="text-green-600 text-sm mb-2">Account created successfully! Please sign in.</p>
            {/if}
            {#if form?.formError}
              <p class="text-red-500 text-sm mb-2">{form.formError.message}</p>
            {/if}
            <SignInForm {data} {form} />
            <p class="text-sm mt-3">Don't have an account? <a href={registerHref} class="text-blue-600 underline">Sign up</a></p>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>

<style>
  @import "../../styles/_shared.scss";
  @import "../../login.scss";
</style>
