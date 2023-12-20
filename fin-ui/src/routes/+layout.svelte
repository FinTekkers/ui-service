<script lang="ts">
  // The ordering of these imports is critical to your app working properly
  import "@skeletonlabs/skeleton/themes/theme-skeleton.css";
  // If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
  import "@skeletonlabs/skeleton/styles/skeleton.css";
  // Most of your app wide CSS should be put in this file
  import "../app.postcss";
  import { AppShell } from "@skeletonlabs/skeleton";
  import { reveal } from "svelte-reveal";

  import Icon from "@iconify/svelte";
  import { goto } from "../lib/helper";
  import Footer from "../components/Footer.svelte";

  // navbar toggle
  import { toggleSidebarMenu, sideMenuStore } from "../store/store";

  // form data
  export let data;
  export let form;
</script>

<AppShell>
  <div class={`hamburger_nav ${$sideMenuStore ? "show" : "hidden"}`}>
    <div class="navigation_bar">
      <div class="logo" on:click={() => goto("/")}>
        <Icon
          icon="material-symbols:finance-mode"
          style="width: 25px; height: 25px;"
        />
        Fintekkers
      </div>

      <div class="search_bar">
        <div class="search_bar_form">
          <form method="post" action="/search">
            <label
              for="default-search"
              class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
              >Search</label
            >
            <div class="relative search_bar_container">
              <input
                type="search"
                name="search"
                id="default-search"
                class="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Search Mockups, Logos..."
                required
              />
              <button
                type="submit"
                class=" search_btn dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
      <div class="navigation_links">
        <ul>
          <li>
            <Icon
              icon="material-symbols:finance-mode"
              style="width: 25px; height: 25px;"
            /><a href="#">Trial</a>
          </li>
          <!-- Can link to the API key once that's built -->
          <li>
            <Icon
              icon="material-symbols:finance-mode"
              style="width: 25px; height: 25px;"
            /><a href="https://github.com/FinTekkers/ledger-models">Docs</a>
          </li>
          <!-- TODO: Update the ledger models README.md for consumers-->
          <li>
            <Icon
              icon="material-symbols:finance-mode"
              style="width: 25px; height: 25px;"
            /><a href="#">Playground</a>
            <!-- Can link to the REPL when built (repl.it seems to work already but need a one-click way to get it up and running)-->
          </li>
          <li>
            <Icon
              icon="material-symbols:finance-mode"
              style="width: 25px; height: 25px;"
            /><a href="#">Contact Us</a>
            <!-- TODO: LinkedIn, WhatsApp biz, Email, ?-->
          </li>
          <li>
            <Icon icon="ic:twotone-phone" style="width: 25px; height: 25px;" />
            412-234-4312 <!-- TODO: WhatsApp biz messenger -->
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
          <li><a href="#">Trial</a></li>
          <li><a href="#">Docs</a></li>
          <li><a href="#">Plugins</a></li>
          <li><a href="#">Playground</a></li>
          <li><a href="#">Contact Us</a></li>
          <li>
            <Icon icon="ic:twotone-phone" style="width: 25px; height: 25px;" />
            412-234-4312
          </li>
        </ul>
      </div>
      <div class="search_bar">
        <div class="search_bar_form">
          <form method="post" action="/search">
            <label
              for="default-search"
              class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
              >Search</label
            >
            <div class="relative search_bar_container">
              <input
                type="search"
                name="search"
                id="default-search"
                class="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Search Mockups, Logos..."
                required
              />
              <button
                type="submit"
                class=" search_btn dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </svelte:fragment>

  <slot />
</AppShell>

<style lang="scss">
  @import "../style.scss";

  .navigation_bar {
    height: 8vh;
    padding: 1em;
    background-color: $background-color;
    @include flex(center, space-between, row, 1em);
    .logo {
      font-weight: bold;
      font-size: 1.2rem;
      cursor: pointer;
      @include flex(center, center, row, 0.5em);
    }

    .navigation_links {
      ul {
        @include flex(center, flex-start, row, 1em);
        width: 50vw;

        li:last-child {
          @include flex(center, center, row, 0.4em);
          margin-left: 1em;
        }
      }
    }

    .search_bar {
      .search_bar_form {
        width: 20vw;

        .search_bar_container {
          input {
            padding: 0.5em 1em;
            border: none;
          }

          .search_btn {
            padding: 0 0.6em;
            height: 100%;
            position: absolute;
            top: 0%;
            right: 0%;
            font-size: 0.8rem;
            background-color: $primary-color;
            border-top-right-radius: 6px;
            border-bottom-right-radius: 6px;
          }
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

    .hamburger_btn {
      display: block;
      position: absolute;
      right: 0;
      margin: 1em;
      z-index: 100;
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

        .search_bar {
          width: 100%;

          .search_bar_form {
            width: 100%;
            height: 6vh;

            .search_bar_container {
              input {
                padding: 1em;
                border: none;
              }
            }
          }
        }

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

        .search_bar {
          width: 100%;
          margin-top: 2em;

          .search_bar_form {
            width: 100%;
            height: 6vh;

            .search_bar_container {
              input {
                padding: 1em;
                border: none;
              }
            }
          }
        }

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
