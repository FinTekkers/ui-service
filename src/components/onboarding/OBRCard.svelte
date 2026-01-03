<script lang="ts">
  // external imports
  import Icon from "@iconify/svelte";
  // internal imports
  import type { userArchetypes } from "../../lib/types";
  export let user: userArchetypes;
  import { customBooleanStoreUpdater } from "../../store/store";
  import { booleanKeys } from "../../lib/Util";
</script>

<div
  class={user.type == "Business" ? "obr_card_notsupported" : "obr_card"}
  on:keydown={() => console.log("")}
  on:click={() => {
    if (user.type !== "Business") {
      customBooleanStoreUpdater(booleanKeys.IS_OBR_PROMPT_SHOWING);
    }
  }}
>
  <slot>
    {#if user.type == "Business"}
      <Icon
        icon="solar:user-linear"
        style="width:50px;height:50px; color:#cccccc; position:absolute; top:20px"
        class={"icon"}
      />
    {:else}
      <Icon
        icon="solar:user-linear"
        style="width:50px;height:50px; color:$primary-color; position:absolute; top:20px"
        class={"icon"}
      />
    {/if}
    <h1 class={user.type == "Business" ? "notSupported" : ""}>{user.title}</h1>
    <p class={user.type == "Business" ? "notSupported" : ""}>
      {user.type == "Business" ? "Not supported yet" : user.content}
    </p>
  </slot>
</div>

<style lang="scss">
  @import "../../styles/_shared.scss";

  .obr_card_notsupported {
    @extend .obr_card;

    &:hover {
      cursor: not-allowed !important;
      border: solid 1px $grey !important;
    }
  }

  .obr_card {
    border-radius: $bd-radius;
    padding: 1em;
    width: 15vw;
    aspect-ratio: 1/1;
    @include flex(column, center, center, 1em);
    transition: all 0.5s ease;
    border: solid 1px $grey;
    position: relative;
    background-color: $white;

    &:hover {
      cursor: pointer;
      border: solid 2px $primary-button;
    }

    h1 {
      color: $black;
      position: absolute;
    }

    :is(p) {
      text-align: center;
      color: $grey;
      position: absolute;
      top: 60%;
    }
  }

  @media screen and (max-width: $breakingpoint_medium) {
    .obr_card {
      width: 25vw;
      aspect-ratio: 1/1;

      h1 {
        color: $black;
        position: absolute;
      }

      :is(p) {
        text-align: center;
        color: $grey;
        position: absolute;
        top: 60%;
        font-size: 0.8rem;
      }
    }
  }

  @media screen and (max-width: $breakingpoint_mobile) {
    .obr_card {
      width: 40vw;
      aspect-ratio: 1/1;

      h1 {
        color: $black;
        position: absolute;
        font-size: 0.8rem;
        margin-top: 2em;
      }

      :is(p) {
        text-align: center;
        color: $grey;
        position: absolute;
        top: 60%;
        font-size: 0.8rem;
        margin-top: 1em;
      }
    }
  }
</style>
