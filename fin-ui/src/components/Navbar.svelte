<script lang="ts">
import IconLink from "./custom_components/IconLink.svelte";
 import { goto } from "$app/navigation";
import {sideBarURLText} from '../lib/uidata'



</script>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="navigation_bar">
      <div class="logo" on:click={() => goto("/")}>
        <IconLink iconName='material-symbols:finance-mode'>
           Fintekkers
        </IconLink>
      </div>
      <div class="navigation_links">
        <ul>
           {#each sideBarURLText as urlText}
           <li>
            <IconLink iconName={urlText.icon} />
            <a href={urlText.url}>{urlText.text}</a>
           </li>
           {/each}
        </ul>
      </div>
      <div class="contact" on:click={()=>goto("/contactus")}>
        <IconLink iconName='akar-icons:price-cut'>
          Contact Us
        </IconLink>
      </div>
    </div>



<style lang="scss">
    @import "../style.scss";



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
          @include flex(row, flex-start, center, 1em);
        }

        .navigation_links {
          width: 100%;
          height: 50vh;
          margin-top: 2em;
          ul {
            @include flex(column, center, center, 1em);
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