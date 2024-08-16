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
      sidebar.style.width = sidebarExpanded ? '25vw' : '70px';
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
  <button
    type="button"
    on:click={toggleSidebar}
    class="absolute top-0 right-[-30px] text-black"
    ><Icon
      icon={sidebarExpanded ? "mdi:hamburger-open" : "mdi:hamburger-close"}
      class="user-menu-icon"
      style="width:30px; height:30px; color:#000000"
    /></button
  >
  <div class=" dashboard_menu_icon user-menu cursor-pointer">

    <!-- svelte-ignore a11y-missing-attribute -->
    <img style="width: 50px; height:50px" src={userAvatar} />
    <span style="color:#7cd2ba">Hi {userInfo}</span>
  </div>

  <div class="api_key_button">
    <button style="color: red;" on:click={()=>generateApiKey()}>get Api Key</button>
    {#if apikeydata}
    <p style="color:red;">{apikeydata}</p>
    {:else}
    <p></p>
    {/if}
  </div>

  <div class="dashboard_user_menu_options">
    {#each Object.entries(dashboardMenuData) as [_menukey, menuValue]}
      <a
        href={menuValue.url}
        class="p-2 user-menu cursor-pointer"
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
    <label class=" user-menu-logout cursor-pointer" for="logout">
      <button type="submit">
        <Icon
          icon="ri:logout-circle-line"
          class="user-menu-icon"
          style="width: 25px; height: 25px;"
        />
      </button>
      <span>Log out</span>
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
    align-items: center;
    padding-top: 2em;
    transition: width 0.5s ease;

    .dashboard_user_menu_options {
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: repeat(5, 1fr);
      height: 50vh;
      width: 100%;
      justify-items: center;
    }

    .user-menu {
      color: $primary-color;
      @include flex(row, flex-start, center, 1em);
      width: 50%;
      margin: 0;
      transition: all 0.5s ease;

      &:hover {
        color: $primary-button;
      }
    }

    form {
      width: 50%;

      .user-menu-logout {
        color: $primary-color;
        @include flex(row, flex-start, center, 1em);
      }
    }

    .user-menu-icon {
      vertical-align: baseline;
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

      .dashboard_menu_icon {
        justify-content: center;
      }

      .dashboard_user_menu_options {
        margin: 0;

        .user-menu {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr;
          justify-items: center;
        }
      }

      form {
        width: 100%;

        span {
          display: none;
        }

        .user-menu-logout {
          padding: 0;
          display: flex;
          justify-content: center;
          gap: 0;
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
</style>
