<script lang="ts">
  // internal imports
import { page } from '$app/stores';
import {goto} from '$lib/helper';

</script>

<div class="branding-image p-2 rounded-xl">
          <div
            class="branding-image-overlay"
          >
            <h1 class="logo" on:keydown={()=>'x'} on:click={()=>  goto("/")}>FINTEKKERS</h1>
            <p>
              You need to sign-up or sign-in to see data. Don't worry,
                this is free, for now!
            </p>
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
          </div>
</div>

<style lang="scss">
 @import "../../style.scss";



</style>