<script lang="ts">
  // external exports
  import Icon from "@iconify/svelte";

  // internal exports
  import { selectedDashboardMenuUpdater } from "../store/store";
  import type { dashboardMenuList } from "$lib/Util";
  import { dashboardMenuData } from "$lib/uidata";
  export let data;

  // user_session_info_variable
  let userInfo: string;
  let userAvatar:string;
  let userId:string;
  let apikeydata:string;

  let sidebarExpanded = true; // Variable to track sidebar state

  const toggleSidebar = () => {
    sidebarExpanded = !sidebarExpanded; // Toggle sidebar state
    const spans = document.querySelectorAll('.dashboard-sidebar span') as NodeListOf<HTMLElement>;
    spans.forEach((span: HTMLElement) => {
      span.style.display = sidebarExpanded ? 'inline' : 'none';
    });

    const sidebar = document.querySelector('.dashboard-sidebar');
    if (sidebar instanceof HTMLElement) {
      sidebar.style.width = sidebarExpanded ? '25vw' : '140px';
    }

    // Change icon based on sidebar state
    const icon = document.querySelector('.sidebar-toggle-icon');
    if (icon instanceof HTMLElement) {
      icon.setAttribute('icon', sidebarExpanded ? 'mdi:hamburger-close' : 'mdi:hamburger-open');
    }
  };

  //  this function is to ensure accessibility
  const handleKeyDown: (key: keyof typeof dashboardMenuList) => void = (
    dashboardMenuKey: keyof typeof dashboardMenuList
  ) => {
    console.log(dashboardMenuKey);
  };

  const generateApiKey = async () => {
      try {
          const usageLimit = 100; // Example value, adjust as needed
          const response = await fetch('/api/api-key', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId, usageLimit }),
          });

          if (!response.ok) {
              throw new Error('Failed to generate API key');
          }

          const data = await response.json();
          apikeydata = await data.apiKey;
      } catch (error) {
          console.error('Error generating API key:', error);
      }
  };

  if (data) {
    try {
      // if session, extract user info
      const {
        userData: {
          user: { name, avatarUrl, id },
        },
      } = data;
      userInfo = name;
      userAvatar = avatarUrl;
      userId = id


    } catch (err: any) {
      console.log("Swallowing error (likely due to 'reading: 'user'': " + err);
    }
  }
</script>

<div class="w-1/4 p-5 flex flex-col gap-20 relative dashboard-sidebar relative">
  <!-- toggle button -->
  <button
    type="button"
    on:click={toggleSidebar}
    class=" toggle-sidebar-button  text-black"
    ><Icon
      icon={sidebarExpanded ? "mdi:hamburger-open" : "mdi:hamburger-close"}
      class="user-menu-icon"

      style="width:30px; height:30px; color:#ffffff"
    /></button
  >

  <!-- avatar and user info -->
  <div class={`dashboard_menu_icon cursor-pointer ${sidebarExpanded ? 'user-menu' : 'user-menu-toggled'} `}>

    <!-- svelte-ignore a11y-missing-attribute -->
    <img style="width: 30px; height:30px;"  class="avatar" src={userAvatar} />
    <span class="user_name">{userInfo}</span>
  </div>

  <!-- <div class="api_key_button">
    <button style="color: red;" on:click={()=>generateApiKey()}>get Api Key</button>
    {#if apikeydata}
    <p style="color:red;">{apikeydata}</p>
    {:else}
    <p></p>
    {/if}
  </div> -->
<!--  -->
  <div class="dashboard_user_menu_options">
    {#each Object.entries(dashboardMenuData) as [_menukey, menuValue]}
      <a
        href={menuValue.url}
        class={`p-2 ${sidebarExpanded ? 'user-menu' : 'user-menu-toggled'} cursor-pointer`}
        on:keydown={() => handleKeyDown("PORTFOLIO")}
        on:click={() => selectedDashboardMenuUpdater(menuValue.location)}
      >
        <Icon
          icon={menuValue.iconName}
          class="user-menu-icon"
          style={menuValue.style}
        />
        <span>{menuValue.menuName}</span>
      </a>
    {/each}
  </div>

  <form method="post" action="?/logout">
    <label class={` ${sidebarExpanded ? 'user-menu-logout' : 'user-menu-logout-toggled'} cursor-pointer`} for="logout">
      <button type="submit">
        <Icon
          icon="solar:logout-3-broken"
          class="user-menu-icon logout_icon"
          style="width: 25px; height: 25px;"
        />
        <span>Log out</span>
      </button>
    </label>
  </form>
</div>

<style lang="scss">
  @import "../style.scss";

  .dashboard-sidebar {
    background-color: $tealwhite;
    width: 25vw;
    display: flex;
    justify-content: flex-start;
    align-items: start;
    padding: 2em;
    transition: width 0.5s ease;
    border: solid 1px rgb(0, 187, 255);

    .dashboard_menu_icon{

       .avatar{
          border-radius: 15%;
          width: 10vw;
          height: 10vw;
          border: solid 1px $bgc-color;
      }

     .user_name{
         font-weight: bolder;
         text-transform:uppercase;

      }
    }

    .dashboard_user_menu_options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: repeat(5, 1fr);
      height: 50vh;
      width: 100%;
      justify-items:flex-start;
      gap: 1em;

    }

  

   

    .user-menu {
      color: $primary-color;
      @include flex(row, flex-start, center, 1em);
      margin: 0;
      width: 100%;
      transition: all 0.5s ease;
      grid-column: 1/-1;
      padding: 1em;
      border-radius: .5em;
      font-weight: bold;

     

      &:hover {
        color: $white;
        background-color:$primary-button ;
      }
    }

    .user-menu-toggled {
      color: $primary-color;
      @include flex(row, center, center, 1em);
      margin: 0;
      width: 100%;
      transition: all 0.5s ease;
      grid-column: 1/-1;
      padding: 1em;
      border-radius: .5em;
      font-weight: bold;

     

      &:hover {
        color: $white;
        background-color:$primary-button ;
      }
    }



    form {
        width: 100%;
        margin-bottom: 3em;

      .user-menu-logout {
        color: $primary-color;
        border-top: solid 1px $grey;
        width: 100%;
        padding-top: 1em;

       
     
        
        button{
            @include flex(row, flex-start, center, 1em);
            margin: 0;
            width: 100%;
            transition: all 0.5s ease;
            grid-column: 1/-1;
            padding: 1em;
            border-radius: .5em;
            font-weight: bold;


        &:hover {
            color: $white;
            background-color:$primary-button ;
       }

       

          
        }
       }

      .user-menu-logout-toggled {
        color: $primary-color;
        border-top: solid 1px $grey;
        width: 100%;
        padding-top: 1em;

      
        button{
            @include flex(row, center, center, 1em);
            margin: 0;
            width: 100%;
            transition: all 0.5s ease;
            grid-column: 1/-1;
            padding: 1em;
            border-radius: .5em;
            font-weight: bold;


        &:hover {
        color: $white;
        background-color:$primary-button ;
       }

       

          
        }
       }

      
    }

    .user-menu-icon {
      vertical-align: baseline;
    }
  }

  .toggle-sidebar-button{
    color: $white;
    position: absolute;
    left: 95%;
    top: 2%;
    background-color: $bgc-color;
    border-radius: 6px;
    cursor: pointer;
    transition: all .5s ease-in-out;

    &:hover{
      background: $primary-button;
      color: $bgc-color;
    }

  }

  @media screen and (max-width: $breakingpoint_medium) {
    .dashboard-sidebar {
      width: 35vw;
    }
  }

  @media screen and (max-width: $breakingpoint_mobile) {
    .dashboard-sidebar {
      display: flex;
      align-items: center;

  .toggle-sidebar-button{
    display: none;
  }
      

    .dashboard_menu_icon {
        justify-content: center;
          width: 20vw;


                  .avatar{
                      border-radius: 15%;
                      width: 15vw;
                      height: 15vw;
                  }

                  .user_name{
                      font-weight: bolder;
                      text-transform:uppercase;

                  }

        
      }

      .dashboard_user_menu_options {
        margin: 0;

        .user-menu {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr;
          justify-items: center;

        }

        .user-menu span{
          display:none;
        }
      }

      form {
        width: 100%;
          display: flex;
          justify-content: center;
          align-content: center;

                .user-menu-logout{
                  display: grid;
                  justify-content: center;


                          button{
                            border: none;

                          }
                  
                  
                          span {
                            display: none;
                          }
          
            
                    }
        }


        div {
          width: 100%;
          margin-right: 1em;

          :is(span) {
            display: none;
          }
        }

      
    }
  }

  @media screen and (min-width: $breakingpoint_mobile) and (max-width: $breakingpoint_medium) {
  /* Your styles here */
   .dashboard-sidebar{

        .toggle-sidebar-button {
          display: none;
        }
        .dashboard_menu_icon{

              .avatar{
                  border-radius: 15%;
                  width: 10vw;
                  height: 10vw;
                  border: solid 1px $bgc-color;
              }

            .user_name{
                font-weight: bolder;
                text-transform:uppercase;
                text-align: center;


              }
            }
        .user-menu{
          @include flex(column, center, center, 1em);
        }

        form{

          .user-menu-logout {
            button{
            display: grid;
            justify-content: center;
            align-items: center;
            justify-items: center;

          }
          }

        }
   }

  }
</style>
