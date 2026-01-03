<script lang="ts">
  // internal imports
  import { booleanStore } from "../../store/store";
  import { booleanKeys } from "../../lib/Util";
  import SignInForm from "./SignInForm.svelte";
  import SignUpForm from "./SignUpForm.svelte";
  import type { formError } from "$lib/types";

  $: isSignInOrSignUp = $booleanStore[booleanKeys.IS_SIGN_IN_OR_SIGN_UP];

  export let data: App.PageData;
  export let form: formError;
</script>

<div class="form w-full p-3 grid flex justify-center bg-white">
  <div class="form_container">
    {#if isSignInOrSignUp}
      <h1 class="form_headline">Sign Up</h1>
    {:else}
      <h1 class="form_headline">Sign In</h1>
    {/if}

    {#if isSignInOrSignUp}
      <SignUpForm {data} {form} />
    {:else}
      <SignInForm {data} {form} />
    {/if}
  </div>
</div>

<style lang="scss">
  @import "../../styles/_shared.scss";

  .form_container {
    position: relative;
  }

  .form_headline {
    position: absolute;
    top: 20%;
  }

  @media screen and (max-width: $breakingpoint_medium) {
    .form_headline {
      top: -20%;
    }
  }

  @media screen and (max-width: $breakingpoint_mobile) {
    .form_headline {
      top: -50%;
    }
  }
</style>
