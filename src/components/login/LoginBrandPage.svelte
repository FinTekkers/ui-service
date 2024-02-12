<script lang="ts">
  // internal imports
import { booleanStore} from '../../store/store';
import { page } from '$app/stores';  
import {booleanKeys} from "$lib/Util";
import {goto} from '$lib/helper';

$:isSignInOrSignUp = $booleanStore[booleanKeys.IS_SIGN_IN_OR_SIGN_UP]
</script>

<div class="branding-image p-2 rounded-xl">
          <div
            class="branding-image-overlay backdrop-blur-lg bg-black/30 rounded-lg"
          >
            <h1 class="logo">FINTEKKERS</h1>
            <p>
              Thousands of Lorem ipsum dolor sit amet consectetur adipisicing
              elit. Fugit, fugiat ullam?
            </p>
            {#if isSignInOrSignUp}
            <button >→ Sign Up</button>
            {:else}
            <button type="button" on:click={()=>{
              if($page.url.pathname === "/register"){
                goto("/login")
              }

              if($page.url.pathname === "/login"){
                goto("/register")
              }
              }}>→ {#if $page.url.pathname == "/register"}
                    Sign in
                    {:else}
                    Sign up
                   {/if}
            </button>
            {/if}
          </div>
</div>

<style lang="scss">
 @import "../../style.scss";
</style>