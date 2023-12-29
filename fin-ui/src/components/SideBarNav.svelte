<script lang="ts">
  import { toggleSidebarMenu, sideMenuStore } from "../store/store";
  import Icon from "@iconify/svelte";
 import { goto } from "$lib/helper";
  import IconLink from "./custom_components/IconLink.svelte";
  import {sideBarURLText} from '../lib/uidata'

</script>

  <div class={`hamburger_nav ${$sideMenuStore ? "show" : "hidden"}`}>
    <div class="navigation_bar">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="logo" on:click={() => goto('/')}>
        <IconLink iconName="material-symbols:finance-mode" >
             Fintekkers
        </IconLink>
      </div>

      <div class="navigation_links">
        <ul>
            {#each sideBarURLText as urlText}
             <li>
                <IconLink iconName={urlText.icon}></IconLink>        
                <a href={urlText.url}>
                {urlText.text}
                </a>
             </li>
            {/each}
        </ul>
      </div>
    </div>
  </div>
  <div class="hamburger_btn">
    {#if $sideMenuStore}
      <button class="close_btn" on:click={() => toggleSidebarMenu()}>
        <Icon icon="ic:outline-close" style="width: 35px; height: 35px;" />
      </button>
    {:else}
      <button class="open_btn" on:click={() => toggleSidebarMenu()}>
        <Icon icon="mdi:hamburger-menu" style="width: 35px; height: 35px;" />
      </button>
    {/if}
  </div>


<style lang="scss">
    @import "../style.scss";

  .hamburger_nav {
    display: none;
  }
  .hamburger_btn {
    display: none;
    padding: 1em;
  }

    @media screen and (max-width: $breakingpoint_medium) {
    .navigation_bar {
      display: none;
    }

     .hamburger_nav {
      display: block;
      width: 30vw;
      height: 100%;
      position: absolute;
      z-index: 3;
      top: 0;
      background-color: $background-color;

      transition: all 0.2s ease-in-out;

      .navigation_bar {
        position: absolute;
        left: 0;
        top: 0;
        display: block;
        background: none;
        padding: 2em;
        width: inherit;
        @include flex(column, space-between, center, 1em);
        margin-top: 2em;

        .logo {
          width: 100%;
          @include flex(row, flex-start, center, 1em);
        }

        .navigation_links {
          width: 100%;
          height: 50vh;
          margin-top: 2em;
          ul {
            @include flex(column, center, center, 1em);
            width: 20vw;

            li {
              width: 100%;
              @include flex(row, flex-start, center, 0.4em);

              &:last-child {
                @include flex(row, flex-start, center, 0.4em);
                margin-left: 0;
              }
            }
          }
        }
      }
    }
    .hamburger_btn {
      display: block;
      position: absolute;
      right: 0;
      margin: 1em;
      z-index: 100;
    }
    .hidden {
      right: -100%;
      display: none;
    }
    .show {
      right: 0%;
    }
  }

  @media screen and (max-width: $breakingpoint_mobile) {
    .hamburger_nav {
      width: 100vw;
      background-color: $background-color;

      .navigation_bar {
        position: absolute;
        left: 0;
        top: 0;
        display: block;
        background: none;
        padding: 2em;
        width: inherit;
        @include flex(column, space-between, center, 1em);
        margin-top: 2em;
        background-color: $background-color;


        .logo {
          width: 100%;
          font-size: 1.5rem;
          font-weight: bold;
          @include flex(row, flex-start, center, 1em);
        }

        .navigation_links {
          width: 100%;
          height: 50vh;
          margin-top: 2em;

          ul {
            @include flex(column, center, center, 3em);
            margin: 0 auto;
            width: 30vw;

            li {
              width: 100%;
              @include flex(row, flex-start, center, 0.4em);

              &:last-child {
                @include flex(row, flex-start, center, 0.4em);
                margin-left: 0;
              }
            }
          }
        }
      }
    }

    .hidden {
        right: -100%;
        display: none;
      }

    .show {
      right: 0%;
    }
  }

</style>