<script lang="ts">
  // external exports
  import Icon from "@iconify/svelte";

  // internal exports
  import { selectedDashboardMenuUpdater } from "../store/store";
  import type { dashboardMenuList } from "$lib/Util";
  import { dashboardMenuData } from "$lib/uidata";

  export let data;
  console.log(`User: ${data.user}`);
  let userInfo: string = data.user ? data.user.name : "No users";
  let userAvatar: string = data.user ? data.user.picture : "";

  let sidebarExpanded = true; // Variable to track sidebar state

  const toggleSidebar = () => {
    sidebarExpanded = !sidebarExpanded; // Toggle sidebar state
    const spans = document.querySelectorAll(
      ".dashboard-sidebar span"
    ) as NodeListOf<HTMLElement>;
    spans.forEach((span: HTMLElement) => {
      span.style.display = sidebarExpanded ? "inline" : "none";
    });

    const sidebar = document.querySelector(".dashboard-sidebar");
    if (sidebar instanceof HTMLElement) {
      sidebar.style.width = sidebarExpanded ? "25vw" : "70px";
    }

    // Change icon based on sidebar state
    const icon = document.querySelector(".sidebar-toggle-icon");
    if (icon instanceof HTMLElement) {
      icon.setAttribute(
        "icon",
        sidebarExpanded ? "mdi:hamburger-close" : "mdi:hamburger-open"
      );
    }
  };

  //  this function is to ensure accessibility
  const handleKeyDown: (key: keyof typeof dashboardMenuList) => void = (
    dashboardMenuKey: keyof typeof dashboardMenuList
  ) => {
    console.log(dashboardMenuKey);
  };
</script>

<div class="w-1/4 p-5 flex flex-col gap-20 relative dashboard-sidebar">
  <button
    type="button"
    on:click={toggleSidebar}
    class="absolute top-2 right-2 text-black"
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

  <div class="dashboard_user_menu_options">
    <a href="/logout" class="p-2 user-menu cursor-pointer">
      <Icon
        icon="mdi:logout"
        class="user-menu-icon"
        style="width: 25px; height: 25px;"
      />
      <span>Logout</span>
    </a>
  </div>
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
    }
  }
</style>
