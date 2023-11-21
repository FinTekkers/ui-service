<script lang="ts">
import {toggleSignInForm, isSignInOrSignUp} from '../store/store'
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
            {#if $isSignInOrSignUp}
            <button on:click={()=>toggleSignInForm()}>→ Sign In</button>
            {:else}
            <button on:click={()=>toggleSignInForm()}>→ Sign Up</button>
            {/if}
          </div>
</div>

<style lang="scss">
 @import "../style.scss";
</style>