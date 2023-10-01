
<script lang="ts">
    import LoginBrandPage from "../components/LoginBrandPage.svelte";
    import LoginForm from "../components/LoginForm.svelte";

  export let data;
  export let form;

</script>



<div class="loginpage_bgc_overlay h-full flex justify-between">
  <form method="post">
    <div class=" w-screen h-screen flex justify-center items-center">
      <div class="login_container grid grid-cols-2 rounded relative">
        <LoginBrandPage />
        <div
          class="branding branding-form p-2 rounded-xl flex justify-center items-center"
        >
        <LoginForm />
        </div>
      </div>
    </div>
  </form>
</div>

<style>
  @import "../style.scss";
  @import "../login.scss";
</style>
