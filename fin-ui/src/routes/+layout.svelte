<script lang="ts">
  import "@skeletonlabs/skeleton/themes/theme-skeleton.css";
  import "@skeletonlabs/skeleton/styles/skeleton.css";
  import "../app.postcss";

  // external imports
  import { AppShell } from "@skeletonlabs/skeleton";
  import Icon from "@iconify/svelte";

  // internal imports
  import { goto } from "../lib/helper";
  import { toggleSidebarMenu, sideMenuStore } from "../store/store";
  // form data
  export let data;
  export let form;
</script>

<AppShell>
  <!-- hamburger navbar to move into own component -->
  <div class={`hamburger_nav ${$sideMenuStore ? "show" : "hidden"}`}>
    <div class="navigation_bar">
      <div class="logo" on:click={() => goto("/")}>
        <Icon
          icon="material-symbols:finance-mode"
          style="width: 25px; height: 25px;"
        />
        Fintekkers
      </div>

      <div class="navigation_links">
        <ul>
          <li>
            <Icon
              icon="material-symbols:finance-mode"
              style="width: 25px; height: 25px;"
            /><a href="#">Get started instantly</a>
          </li>
          <li>
            <Icon
              icon="material-symbols:finance-mode"
              style="width: 25px; height: 25px;"
            /><a href="https://github.com/FinTekkers/ledger-models">Docs</a>
          </li>
          <li>
            <Icon
              icon="material-symbols:finance-mode"
              style="width: 25px; height: 25px;"
            /><a href="#">Pricing</a>
          </li>
          <li>
            <Icon
              icon="material-symbols:finance-mode"
              style="width: 25px; height: 25px;"
            /><a href="#">Contact Us</a>
          </li>
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

 <!-- main navigation bar -->
  <svelte:fragment slot="header">
    <div class="navigation_bar">
      <div class="logo" on:click={() => goto("/")}>
        <Icon
          icon="material-symbols:finance-mode"
          style="width: 25px; height: 25px;"
        />
        Fintekkers
      </div>
      <div class="navigation_links">
        <ul>
          <li>
            <a href="#todo_link_to_repl_when_complete">Get started</a>
          </li>
          <li>
            <a href="https://github.com/FinTekkers/ledger-models">
               <Icon
          icon="solar:document-outline"
          style="width: 25px; height: 25px;"
        />
              Docs</a>
          </li>
          <li><a href="#">
             <Icon
          icon="akar-icons:price-cut"
          style="width: 25px; height: 25px;"
        />
            Pricing (currently free for everyone)</a></li>
          <li><a href="#">
             <Icon
          icon="grommet-icons:contact"
          style="width: 25px; height: 25px;"
        />
            Contact Us</a></li>
        </ul>
      </div>
    </div>
  </svelte:fragment>

  <!-- body -->
  <slot />
</AppShell>

<style lang="scss">
  @import "../style.scss";

  .navigation_bar {
    height: 10vh;
    padding: 1em;
    background-color: $background-color;
    @include flex(row, space-between, center, 1em);
        .logo {
          font-weight: bold;
          font-size: 1.2rem;
          margin-left: 3em;
          cursor: pointer;
          @include flex(center, center, row, 0.5em);
        }

        .navigation_links {
              ul {
                @include flex(row, center, center, 1em);
                width: 60vw;

                li{
                  padding: .6em 1em ;
                  position: relative;
                  cursor: pointer;

                  &:not(:first-child)::before {
                    content: '';
                    width: 0; 
                    height: 2px;
                    background-color: $primary-color;
                    position: absolute;
                    bottom: -1%;
                    border-radius: $bd-radius;
                    left: 0%; 
                    transform: translateX(-50%);
                    transition: width 0.5s ease-in-out, left 0.5s ease-in-out; 
                  }

                  &:hover::before {
                    width: 95%; 
                    left: 50%;

                  }
                  a{

                    @include flex(row, center, center, .5em);

                    
                  }
                }

                li:first-child{
                  border-radius: 50px;
                  background-color: $success;
                  transition: all .5s ease-in-out;
                  color: $background-color;
                  font-weight: bold;


                  &:hover{
                    background-color: $primary-color;
                    color:$white
                  }
                }

                li:last-child {
                  @include flex(center, center, row, 0.4em);
                  margin-left: 1em;
                }
              }
        }
  }


  .hamburger_nav {
    display: none;
  }
  .hamburger_btn {
    display: none;
    padding: 1em;
  }

  @media screen and (max-width: $breakingpoint_md) {
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
