<script lang="ts">
  // The ordering of these imports is critical to your app working properly
  import "@skeletonlabs/skeleton/themes/theme-skeleton.css";
  // If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
  import "@skeletonlabs/skeleton/styles/skeleton.css";
  // Most of your app wide CSS should be put in this file
  import "../app.postcss";
  import { AppShell } from "@skeletonlabs/skeleton";
  import {reveal} from 'svelte-reveal';

  import Icon from "@iconify/svelte";
  import {goto} from '../lib/helper';

  // navbar toggle
  import {toggleSidebarMenu,sideMenuStore} from '../store/store'


  // form data
  export let data;
  export let form;


  
</script>

<AppShell>
	  <div class={`hamburger_nav ${$sideMenuStore ? 'show' : 'hidden'}` }>
    
    </div>

   <div class="hamburger_btn">
     {#if $sideMenuStore}
      <button class="close_btn" on:click={()=>toggleSidebarMenu()}>
       <Icon icon='ic:outline-close'
         style="width: 35px; height: 35px;"
       />
     </button>
     {:else}
     <button class="open_btn" on:click={()=>toggleSidebarMenu()}>
       <Icon icon='mdi:hamburger-menu'
         style="width: 35px; height: 35px;"
       />
     </button>
     {/if}
    
  
   </div>

    <div class="navigation_bar"  >
       <div class="logo" on:click={()=>goto('/')}>
          <Icon
                      icon="material-symbols:finance-mode"
                      style="width: 25px; height: 25px;"
                      
                    /> 
        Fintekkers</div>
       <div class="navigation_links">
         <ul>
           <li><a href="#">Trial</a></li>
           <li><a href="#">Docs</a></li>
           <li><a href="#">Plugins</a></li>
           <li><a href="#">Playground</a></li>
           <li><a href="#">Contact Us</a></li>
           <li>
              <Icon
                      icon="ic:twotone-phone"
                      style="width: 25px; height: 25px;"
                      
                    /> 
              412-234-4312
          </li>
         </ul>
       </div>
       <div class="search_bar">
         <div class="search_bar_form">
            <form method="post" action="/search">   
                <label for="default-search" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                <div class="relative search_bar_container">
                 
                    <input type="search" name="search" id="default-search" class="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search Mockups, Logos..." required>
                    <button type="submit" class=" search_btn  dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                     Search
                    </button>
                </div>
            </form>
  
         </div>
       </div>
    </div>


  <slot />

  <div class="Footer">
        <div class="footer_content">

          <div class="footer_logo" >
           
            <h2>   <Icon
                      icon="material-symbols:finance-mode"
                      style="width: 25px; height: 25px;"
                      
                    />  Fintekkers</h2>
          </div>

         <div class="social_links">

          <div class="icon" data-custom='facebook'>

            <Icon
                      icon="basil:facebook-outline"
                      style="width: 25px; height: 25px;"
                      
                    /> 
          </div>

          <div class="icon" data-custom='stackoverflow'>
             <Icon
                      icon="jam:stackoverflow"
                      style="width: 25px; height: 25px;"
                      
                    /> 
          </div>

          <div class="icon" data-custom='github'>

            <Icon
                      icon="ri:github-fill"
                      style="width: 25px; height: 25px;"
                      
                    /> 

          </div>
          <div class="icon" data-custom='twitter'>
            <Icon
                      icon="pajamas:twitter"
                      style="width: 25px; height: 25px;"
                      
                    /> 

          </div>
           
            
            
        </div>

          <div class="quicklinks">
            <h1>About Us</h1>
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">About us</a></li>
              <li><a href="#">Contact info</a></li>
              <li><a href="#">Reviews</a></li>
            </ul>
          </div>
          <div class="Product overview">
            <h1>Product Overview</h1>
            <ul>
              <li><a href="#">Trade Idea</a></li>
              <li><a href="#">Analysis</a></li>
              <li><a href="#">Pricing</a></li>
            </ul>
          </div>
          <div class="ressources">
            <h1>Contact Info</h1>
            <ul>
              <li><a href="#">University</a></li>
              <li><a href="#">Learning Center</a></li>
              <li><a href="#">Support</a></li>
            </ul>
          </div>

        </div>

        
  </div>
</AppShell>


<style lang="scss">
  @import "../style.scss";

  .navigation_bar{
    height: 8vh;
    padding: 1em;
    background-color: $background-color;
    @include flex(center, space-between, row, 1em);
    .logo{
      font-weight: bold;
      font-size: 1.2rem;
      cursor: pointer;
    @include flex(center, center, row, .5em);

    }

    .navigation_links{
      ul{
      @include flex(center, flex-start, row, 1em);
      width: 50vw;

      li:last-child{
      @include flex(center, center, row, .4em);
      margin-left: 1em;
        
      }
      }
    }

    .search_bar{
      .search_bar_form{
        width: 20vw;

        .search_bar_container{
          input{
            padding: .5em 1em ;
            border: none;
          }

          .search_btn{
            padding: 0 .6em;
            height: 100%;
            position: absolute;
            top: 0%;
            right: 0%;
            font-size: .8rem;
            background-color: $primary-color;
            border-top-right-radius: 6px;
            border-bottom-right-radius: 6px;
          }
        }
      }
    }

  }

  .Footer{
    width: 100%;
    height: 50vh;
    padding: 1em;
    @include flex(row,center, center, 1em);
    background-color: $background-color;
    position: relative;
    bottom: -250vh;
    clear: both;


    

    .footer_content{
    width: 40vw;
    @include flex(row,space-between, flex-start, 1em);

    .footer_logo{
      position: absolute;
      width: 10vw;
      left: 10%;
   
      h2{
              @include flex(row,space-between, flex-start, .5em);

      }
    }

    .social_links{
    position: absolute;
    right:  -10%;
    width: 30vw;
    @include flex(row,space-between, flex-start, 1em);

    .icon{
      cursor: pointer;
      position: relative;

      &::before{
        position: absolute;
        left: 2vw;
        opacity: 0;
        content: attr(data-custom);
        transition: all .5s ease;
      }

      &:hover::before{
        left: 2.5vw;
        opacity: 1;
      
      }
    }

    }

    div:nth-child(n){
    @include flex(column,space-between, flex-start, 1em);

    ul{
    @include flex(column,space-between, flex-start, 1em);
      
    }

    }

    }
  }

  .hamburger_nav{
    display: none;
  }

  .hamburger_btn{
      display: none;

  }

  @media screen and (max-width: 1200px) {
     .navigation_bar{
       display: none;
     }
     
     .hamburger_btn{
       display: block;
       position: absolute;
       right: 0;
       margin: 1em;  
       z-index: 100;
      }


      .hidden{
        right: -100%;
      }

      .show{
        right: 0%;
      }
     

     .hamburger_nav{
      display: block;
      width: 30vw;
      height: 100%;
      position: absolute;
      z-index: 3;
      top: 0;
      background-color: $primary-color;
      transition: all .2s ease-in-out;
     }

  }

   @media screen and (max-width: 600px) {
   .hamburger_nav{
      width: 100vw;
      background-color: $primary-color;
     }

   }

</style>