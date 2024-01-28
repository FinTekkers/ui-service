<script lang="ts">
  import { isSignInOrSignUp } from '../../store/store';
  import SignInForm from "./SignInForm.svelte";
  import SignUpForm from "./SignUpForm.svelte";
  

  let isPasswordVisible = false;

  const togglePasswordVisibility = ()=>{
    isPasswordVisible = !isPasswordVisible ;
  }

  export let data:any;
  export let form:Login.formError;



 </script>   



<div class="form w-full p-3 grid flex justify-center">
            <div class="form_container">
              {#if $isSignInOrSignUp}
              <h1 class="form_headline">Sign Up</h1>
              {:else}
               <h1 class="form_headline">Sign In</h1>
              {/if}

              {#if $isSignInOrSignUp}

              <SignUpForm data={data} form={form} />

              {:else}

              <SignInForm data={data} form={form} />


              {/if}
  
            
            </div>
          </div>



    
