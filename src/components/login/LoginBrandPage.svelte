<script lang="ts">
  // internal imports
import {customBooleanStoreUpdater, booleanStore} from '../../store/store';
import {booleanKeys} from "$lib/Util"

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
            <button on:click={()=>customBooleanStoreUpdater(booleanKeys.IS_SIGN_IN_OR_SIGN_UP)}>→ Sign In</button>
            {:else}
            <button on:click={()=>customBooleanStoreUpdater(booleanKeys.IS_SIGN_IN_OR_SIGN_UP)}>→ Sign Up</button>
            {/if}
          </div>
</div>

<style lang="scss">
 @import "../../style.scss";
</style>