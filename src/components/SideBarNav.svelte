<script lang="ts">
  import { booleanStore, customBooleanStoreUpdater } from "../store/store";
  import {booleanKeys} from '../lib/Util';
  import Icon from "@iconify/svelte";
 import { goto } from "$lib/helper";
  import IconLink from "./custom_components/IconLink.svelte";
  import {sideBarURLText} from '../lib/uidata'

  $: isSideNavActive = $booleanStore[booleanKeys.IS_SIDE_NAV_ACTIVE];


</script>

  <div class={`hamburger_nav ${isSideNavActive ? "show" : "hidden"}`}>
    <div class="sidebar-navigation">
      <div class="logo" on:keydown={()=>('x')} on:click={() => goto('/')}>
        <IconLink iconName="carbon:finance" >
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

      <div class="contact" on:keydown={()=>('x')} on:click={()=>goto("/contactus")}>
        <IconLink iconName='bytesize:mail'>
          Contact Us
        </IconLink>
      </div>
    </div>
  </div>
  <div class="hamburger_btn">
    {#if isSideNavActive}
      <button class="close_btn" on:click={() => customBooleanStoreUpdater(booleanKeys.IS_SIDE_NAV_ACTIVE)}>
        <Icon icon="ic:outline-close" style="width: 35px; height: 35px;" />
      </button>
    {:else}
      <button class="open_btn" on:click={() => customBooleanStoreUpdater(booleanKeys.IS_SIDE_NAV_ACTIVE)}>
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

  .sidebar-navigation{
    display: grid;
    grid-template-columns: repeat(5,1fr);
    grid-template-rows: repeat(5,100px);

    div:nth-child(n){
      grid-column: 1/-1;
      cursor: pointer;
      margin: 0 auto;
      justify-content: center;
      width: 100%;
    }

    
    .logo{
      grid-row:2/2;
      @include flex(row, flex-start, flex-start, 1em);
      font-weight: bold;
    }

    .navigation_links{
      grid-row: 3/5;

      ul{
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: repeat(5, 50px);
        justify-content: center;
        justify-items: center;


        li{
          @include flex(row, flex-start, flex-start, 1em);
          position: relative;

                 &::before {
                    content: '';
                    width: 0; 
                    height: 2px;
                    background-color: $primary-color;
                    position: absolute;
                    bottom: 30%;
                    border-radius: $bd-radius;
                    left: 0%; 
                    transform: translateX(-50%);
                    transition: width 0.5s ease-in-out, left 0.5s ease-in-out; 
                  }

                  &:hover::before {
                    width: 95%; 
                    left: 50%;

                  }

        }

        
               

  
      }
    }

    .contact{
      grid-row: 5/6;
          @include flex(row, flex-start, flex-start, 1em);
    }
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
      background-color: $bgc-color;

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
          :is(ul) {
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
      background-color: $bgc-color;

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
        background-color: $bgc-color;


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
          display: none;

          :is(ul) {
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