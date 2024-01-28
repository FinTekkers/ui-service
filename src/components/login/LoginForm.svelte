<script lang="ts">

  // internal imports
  import { booleanStore } from '../../store/store';
  import {booleanKeys} from '../../lib/Util'
  import SignInForm from "./SignInForm.svelte";
  import SignUpForm from "./SignUpForm.svelte";

  $:isSignInOrSignUp = $booleanStore[booleanKeys.IS_SIGN_IN_OR_SIGN_UP]
  

  export let data:any;
  export let form:App.Error;

 </script>   


<div class="form w-full p-3 grid flex justify-center">
            <div class="form_container">
                {#if isSignInOrSignUp}
                     <h1 class="form_headline">Sign Up</h1>
                {:else}
                     <h1 class="form_headline">Sign In</h1>
                {/if}

                {#if isSignInOrSignUp}
                     <SignUpForm data={data} form={form} />
                {:else}
                     <SignInForm data={data} form={form} />
                {/if}    
            </div>
</div>



    