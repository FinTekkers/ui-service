
<script lang="ts">
  import LoginBrandPage from "../../components/login/LoginBrandPage.svelte";
  import SignUpForm from "../../components/login/SignUpForm.svelte";
  import {goto} from "$lib/helper";
  import {booleanStore} from '../../store/store';
  import {booleanKeys} from "$lib/Util"
  export let data:App.PageData;
  export let form:App.Error;


  $:isSignInOrSignUp = $booleanStore[booleanKeys.IS_SIGN_IN_OR_SIGN_UP]

 



</script>

<div class="loginpage_bgc_overlay h-full flex justify-between">
  <form method="POST" action= "?/register">

    <div class="login-container-parent w-screen h-screen flex justify-center items-center">
      <div class="login_container grid grid-cols-2 rounded relative">
        <LoginBrandPage />
              <div
                class="branding branding-form p-2 rounded-xl flex justify-center items-center"
              >

              <div class="form w-full p-3 grid flex justify-center bg-white">
            <div class="form_container">
                <h1 class="form_headline">Sign Up</h1>
               
                  <SignUpForm data={data} form={form} />
              
                    </div>
             </div>               
             </div>
      </div>
    </div>
  </form>
</div>




    

<style >
 @import "../../style.scss";
 @import "../../login.scss";

  .form_container{
    position: relative;
  }

   .form_headline{
    position: absolute;
    top: 20%;
  }

  @media screen and (max-width: 600px){

   .form_headline{
    top: -5%;
  }
  }



</style>