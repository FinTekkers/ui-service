<script lang="ts">
  import LoginBrandPage from "../../components/login/LoginBrandPage.svelte";
  import SignInForm from "../../components/login/SignInForm.svelte";
  export let data:App.PageData;
  export let form:App.Error;
</script>

<div class="loginpage_bgc_overlay h-full flex justify-between">
  <div class="login-container-parent w-screen h-screen flex justify-center items-center">
  <div class="login_container grid grid-cols-2 rounded relative">
    <LoginBrandPage />

    <div class="branding branding-form p-2 rounded-xl flex justify-center items-center">
      <div class="form w-full p-3 grid flex justify-center bg-white">
          <div class="form_container">
              <h1 class="form_headline">Sign In</h1>
              <SignInForm data={data} form={form}  />
         </div>
      </div>
    </div>
  </div>
  </div>
</div>

<style>
  @import "../../style.scss";
  @import "../../login.scss";
</style>
