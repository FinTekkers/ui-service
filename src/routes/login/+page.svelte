
<script lang="ts">
  import LoginBrandPage from "../../components/login/LoginBrandPage.svelte";
  import LoginForm from "../../components/login/LoginForm.svelte";
  import SignInForm from "../../components/login/SignInForm.svelte";
  import {booleanStore} from '../../store/store';
  import {booleanKeys} from "$lib/Util";
  import {page} from "$app/stores";
  export let data:App.PageData;
  export let form:App.Error;


  $:isSignInOrSignUp = $booleanStore[booleanKeys.IS_SIGN_IN_OR_SIGN_UP]

 



</script>

<div class="loginpage_bgc_overlay h-full flex justify-between">
  <form method="POST" action={`${isSignInOrSignUp ? "?/register" : "?/login"}`} 
  >

    <div class="login-container-parent w-screen h-screen flex justify-center items-center">
      <div class="login_container grid grid-cols-2 rounded relative">
        <LoginBrandPage />
              <div
                class="branding branding-form p-2 rounded-xl flex justify-center items-center"
              >
                  <div class="form w-full p-3 grid flex justify-center bg-white">
            <div class="form_container">
                <h1 class="form_headline">Sign In</h1>
               
                  <SignInForm data={data} form={form}  />
          
             </div>
              </div>
      </div>
    </div>
  </form>
</div>

<style >
  @import "../../style.scss";
  @import "../../login.scss";

</style>